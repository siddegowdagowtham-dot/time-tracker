const CATEGORY_COLORS = {
  Work: "#3b82f6",
  Health: "#22c55e",
  Learning: "#a855f7",
  Personal: "#f59e0b",
  Entertainment: "#ec4899",
  Chores: "#6366f1",
  Social: "#14b8a6",
  Sleep: "#64748b",
  Music: "#f97316",
  Other: "#78716c",
};

let updateInterval;

document.addEventListener("DOMContentLoaded", () => {
  updateStatus();
  updateSummary();
  updateInterval = setInterval(updateStatus, 1000);

  document.getElementById("pauseBtn").addEventListener("click", togglePause);
  document.getElementById("openOptions").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("openDashboard").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });
});

async function updateStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    if (!status) return;

    const dot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    const pauseIcon = document.getElementById("pauseIcon");
    const playIcon = document.getElementById("playIcon");

    if (status.isPaused) {
      dot.className = "dot paused";
      statusText.textContent = "Paused";
      pauseIcon.style.display = "none";
      playIcon.style.display = "block";
    } else if (status.isIdle || !status.windowFocused) {
      dot.className = "dot idle";
      statusText.textContent = status.isIdle ? "Idle" : "Browser unfocused";
      pauseIcon.style.display = "block";
      playIcon.style.display = "none";
    } else if (status.isTracking) {
      dot.className = "dot tracking";
      statusText.textContent = "Tracking";
      pauseIcon.style.display = "block";
      playIcon.style.display = "none";
    } else {
      dot.className = "dot idle";
      statusText.textContent = "Not tracking";
      pauseIcon.style.display = "block";
      playIcon.style.display = "none";
    }

    // Current tab info
    const label = document.getElementById("currentLabel");
    const category = document.getElementById("currentCategory");
    const duration = document.getElementById("currentDuration");

    if (status.currentTab && status.currentTab.url) {
      label.textContent = status.currentTab.label || "Unknown";
      category.textContent = status.currentTab.category;
      category.style.backgroundColor =
        (CATEGORY_COLORS[status.currentTab.category] || "#78716c") + "20";
      category.style.color =
        CATEGORY_COLORS[status.currentTab.category] || "#78716c";
      duration.textContent = formatDuration(status.currentTab.duration);
    } else {
      label.textContent = "No active tab";
      category.textContent = "";
      duration.textContent = "0m 00s";
    }

    // Audio section
    const audioSection = document.getElementById("audioSection");
    const audioList = document.getElementById("audioList");
    if (status.audibleTabs && status.audibleTabs.length > 0) {
      audioSection.style.display = "block";
      audioList.innerHTML = status.audibleTabs
        .map(
          (tab) => `
        <div class="audio-item">
          <span>${tab.label}</span>
          <span>${formatDuration(tab.duration)}</span>
        </div>
      `
        )
        .join("");
    } else {
      audioSection.style.display = "none";
    }
  } catch {
    // Extension context may be invalidated
  }
}

async function updateSummary() {
  try {
    const data = await chrome.runtime.sendMessage({ type: "GET_SUMMARY" });
    if (!data || !data.today) return;

    const { today } = data;

    // Total time
    document.getElementById("totalTime").textContent = formatMinutes(
      today.totalMinutes
    );

    // Category bars
    const barsEl = document.getElementById("categoryBars");
    const maxMinutes = Math.max(
      ...Object.values(today.categoryBreakdown),
      1
    );

    if (Object.keys(today.categoryBreakdown).length === 0) {
      barsEl.innerHTML =
        '<div class="empty-state">No activity tracked yet today</div>';
    } else {
      barsEl.innerHTML = Object.entries(today.categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .map(
          ([cat, mins]) => `
        <div class="cat-row">
          <span class="cat-name">${cat}</span>
          <div class="cat-bar-bg">
            <div class="cat-bar-fill" style="width:${(mins / maxMinutes) * 100}%;background:${CATEGORY_COLORS[cat] || "#78716c"}"></div>
          </div>
          <span class="cat-time">${formatMinutes(mins)}</span>
        </div>
      `
        )
        .join("");
    }

    // Top sites
    const sitesEl = document.getElementById("topSites");
    if (today.topSites && today.topSites.length > 0) {
      sitesEl.innerHTML = today.topSites
        .slice(0, 5)
        .map(
          (site) => `
        <div class="top-site">
          <span class="top-site-label">${site.label}</span>
          <span class="top-site-time">${formatMinutes(site.minutes)}</span>
        </div>
      `
        )
        .join("");
    }
  } catch {
    // Extension context invalidated
  }
}

async function togglePause() {
  try {
    await chrome.runtime.sendMessage({ type: "TOGGLE_PAUSE" });
    updateStatus();
  } catch {
    // Extension context invalidated
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatMinutes(totalMinutes) {
  if (totalMinutes < 1) return "<1m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
