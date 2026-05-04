import { categorizeUrl } from "./utils/categories.js";

const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes
const SAVE_INTERVAL_MINUTES = 1;
const HEARTBEAT_INTERVAL_SECONDS = 15;

let state = {
  activeTabId: null,
  activeTabUrl: null,
  activeTabTitle: null,
  activeSegmentStart: null,
  isIdle: false,
  isPaused: false,
  windowFocused: true,
  audibleTabs: new Map(), // tabId -> { url, title, startTime }
};

// ── Initialization ──

chrome.runtime.onInstalled.addListener(() => {
  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
  chrome.alarms.create("save-heartbeat", { periodInMinutes: SAVE_INTERVAL_MINUTES });
  initializeStorage();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
  chrome.alarms.create("save-heartbeat", { periodInMinutes: SAVE_INTERVAL_MINUTES });
});

async function initializeStorage() {
  const result = await chrome.storage.local.get(["activities", "todayKey"]);
  const todayKey = getDateKey();
  if (!result.activities || result.todayKey !== todayKey) {
    await chrome.storage.local.set({
      activities: result.activities || [],
      todayKey,
      dailySummaries: (await chrome.storage.local.get("dailySummaries")).dailySummaries || {},
    });
  }
}

// ── Tab Tracking ──

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (state.isPaused) return;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await switchActiveTab(tab);
  } catch {
    // Tab may have been closed
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (state.isPaused) return;

  // Track audible state changes
  if (changeInfo.audible !== undefined) {
    handleAudibleChange(tabId, tab, changeInfo.audible);
  }

  // Only track URL changes on the active tab
  if (tabId === state.activeTabId && changeInfo.url) {
    await switchActiveTab(tab);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.activeTabId) {
    finalizeCurrentSegment();
    state.activeTabId = null;
    state.activeTabUrl = null;
    state.activeTabTitle = null;
  }
  state.audibleTabs.delete(tabId);
});

// ── Window Focus ──

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (state.isPaused) return;

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    state.windowFocused = false;
    finalizeCurrentSegment();
  } else {
    // Browser gained focus
    state.windowFocused = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) {
        await switchActiveTab(tab);
      }
    } catch {
      // Window may not have tabs
    }
  }
});

// ── Idle Detection ──

chrome.idle.onStateChanged.addListener((idleState) => {
  if (state.isPaused) return;

  if (idleState === "idle" || idleState === "locked") {
    state.isIdle = true;
    finalizeCurrentSegment();
  } else if (idleState === "active") {
    state.isIdle = false;
    // Resume tracking the current tab
    if (state.activeTabId && state.windowFocused) {
      state.activeSegmentStart = Date.now();
    }
  }
});

// ── Audio Tracking ──

function handleAudibleChange(tabId, tab, isAudible) {
  if (isAudible) {
    const { category, label, passive } = categorizeUrl(tab.url);
    state.audibleTabs.set(tabId, {
      url: tab.url,
      title: tab.title,
      startTime: Date.now(),
      category,
      label,
      passive,
    });
  } else {
    const audioInfo = state.audibleTabs.get(tabId);
    if (audioInfo) {
      // Save passive audio activity
      if (audioInfo.passive) {
        saveActivity({
          url: audioInfo.url,
          title: audioInfo.title,
          category: audioInfo.category,
          label: audioInfo.label,
          startTime: audioInfo.startTime,
          endTime: Date.now(),
          type: "passive",
          source: "audio",
        });
      }
      state.audibleTabs.delete(tabId);
    }
  }
}

// ── Core Tracking Logic ──

async function switchActiveTab(tab) {
  if (!tab || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
    finalizeCurrentSegment();
    return;
  }

  // Don't restart tracking if same URL
  if (tab.url === state.activeTabUrl && state.activeSegmentStart) {
    state.activeTabTitle = tab.title;
    return;
  }

  // Finalize the previous segment
  finalizeCurrentSegment();

  // Start new segment
  state.activeTabId = tab.id;
  state.activeTabUrl = tab.url;
  state.activeTabTitle = tab.title;

  if (!state.isIdle && state.windowFocused) {
    state.activeSegmentStart = Date.now();
  }
}

function finalizeCurrentSegment() {
  if (!state.activeSegmentStart || !state.activeTabUrl) return;

  const now = Date.now();
  const duration = now - state.activeSegmentStart;

  // Only save if duration > 2 seconds (filter noise)
  if (duration > 2000) {
    const { category, label, passive } = categorizeUrl(state.activeTabUrl);

    saveActivity({
      url: state.activeTabUrl,
      title: state.activeTabTitle || "",
      category,
      label,
      startTime: state.activeSegmentStart,
      endTime: now,
      type: passive ? "passive" : "active",
      source: "tab",
    });
  }

  state.activeSegmentStart = null;
}

// ── Storage ──

async function saveActivity(activity) {
  const result = await chrome.storage.local.get(["activities", "todayKey"]);
  const todayKey = getDateKey();
  let activities = result.activities || [];

  // If day changed, archive yesterday and start fresh
  if (result.todayKey !== todayKey) {
    await archiveDay(result.todayKey, activities);
    activities = [];
  }

  // Merge with existing if same URL and recent (within 30s gap)
  const lastActivity = activities[activities.length - 1];
  if (
    lastActivity &&
    lastActivity.url === activity.url &&
    activity.startTime - lastActivity.endTime < 30000
  ) {
    lastActivity.endTime = activity.endTime;
  } else {
    activities.push({
      id: crypto.randomUUID(),
      ...activity,
      date: todayKey,
    });
  }

  await chrome.storage.local.set({ activities, todayKey });
}

async function archiveDay(dateKey, activities) {
  if (!dateKey || activities.length === 0) return;

  const result = await chrome.storage.local.get("dailySummaries");
  const summaries = result.dailySummaries || {};

  const categoryTotals = {};
  let totalMs = 0;

  activities.forEach((a) => {
    const ms = a.endTime - a.startTime;
    totalMs += ms;
    categoryTotals[a.category] = (categoryTotals[a.category] || 0) + ms;
  });

  summaries[dateKey] = {
    totalMinutes: Math.round(totalMs / 60000),
    categoryBreakdown: Object.fromEntries(
      Object.entries(categoryTotals).map(([k, v]) => [k, Math.round(v / 60000)])
    ),
    activityCount: activities.length,
  };

  // Keep last 90 days
  const keys = Object.keys(summaries).sort();
  if (keys.length > 90) {
    keys.slice(0, keys.length - 90).forEach((k) => delete summaries[k]);
  }

  await chrome.storage.local.set({ dailySummaries: summaries });
}

// ── Heartbeat / Alarm ──

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "save-heartbeat") {
    // Periodically finalize and restart the current segment
    // This ensures we don't lose data if the service worker dies
    if (state.activeSegmentStart && state.activeTabUrl && !state.isIdle && state.windowFocused) {
      finalizeCurrentSegment();
      state.activeSegmentStart = Date.now();
    }
  }
});

// ── Message Handling (from popup/dashboard) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // async response
});

async function handleMessage(message) {
  switch (message.type) {
    case "GET_STATUS": {
      const currentDuration = state.activeSegmentStart
        ? Date.now() - state.activeSegmentStart
        : 0;
      const { category, label } = state.activeTabUrl
        ? categorizeUrl(state.activeTabUrl)
        : { category: "Other", label: "None" };

      return {
        isTracking: !!state.activeSegmentStart && !state.isIdle && state.windowFocused,
        isPaused: state.isPaused,
        isIdle: state.isIdle,
        windowFocused: state.windowFocused,
        currentTab: {
          url: state.activeTabUrl,
          title: state.activeTabTitle,
          category,
          label,
          duration: currentDuration,
        },
        audibleTabs: Array.from(state.audibleTabs.entries()).map(([id, info]) => ({
          tabId: id,
          ...info,
          duration: Date.now() - info.startTime,
        })),
      };
    }

    case "GET_TODAY": {
      const result = await chrome.storage.local.get("activities");
      return { activities: result.activities || [] };
    }

    case "GET_SUMMARY": {
      const result = await chrome.storage.local.get(["activities", "dailySummaries"]);
      const activities = result.activities || [];
      const summaries = result.dailySummaries || {};

      // Compute today's summary
      const categoryTotals = {};
      const domainTotals = {};
      let totalMs = 0;

      activities.forEach((a) => {
        const ms = a.endTime - a.startTime;
        totalMs += ms;
        categoryTotals[a.category] = (categoryTotals[a.category] || 0) + ms;
        domainTotals[a.label] = (domainTotals[a.label] || 0) + ms;
      });

      return {
        today: {
          totalMinutes: Math.round(totalMs / 60000),
          categoryBreakdown: Object.fromEntries(
            Object.entries(categoryTotals).map(([k, v]) => [k, Math.round(v / 60000)])
          ),
          topSites: Object.entries(domainTotals)
            .map(([label, ms]) => ({ label, minutes: Math.round(ms / 60000) }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 10),
          activityCount: activities.length,
        },
        history: summaries,
      };
    }

    case "TOGGLE_PAUSE": {
      state.isPaused = !state.isPaused;
      if (state.isPaused) {
        finalizeCurrentSegment();
      } else {
        // Resume tracking
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) await switchActiveTab(tab);
        } catch {
          // No active tab
        }
      }
      return { isPaused: state.isPaused };
    }

    case "GET_ACTIVITIES_EXPORT": {
      const allData = await chrome.storage.local.get(["activities", "dailySummaries"]);
      return allData;
    }

    default:
      return { error: "Unknown message type" };
  }
}

// ── Utilities ──

function getDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
