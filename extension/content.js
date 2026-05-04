// Content script: detects user activity on pages for more granular idle detection
// Reports activity signals to the background service worker

let lastActivity = Date.now();
const ACTIVITY_REPORT_INTERVAL = 30000; // Report every 30s

function reportActivity() {
  const now = Date.now();
  const idleDuration = now - lastActivity;

  chrome.runtime.sendMessage({
    type: "PAGE_ACTIVITY",
    idle: idleDuration > 60000, // Idle if no interaction for 1 min
    idleDuration,
    url: window.location.href,
    title: document.title,
    hasAudio: hasActiveMedia(),
    isVisible: document.visibilityState === "visible",
  }).catch(() => {
    // Extension context may be invalidated
  });
}

function hasActiveMedia() {
  const mediaElements = document.querySelectorAll("video, audio");
  for (const el of mediaElements) {
    if (!el.paused && !el.muted) return true;
  }
  return false;
}

// Track user interactions
const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

function onActivity() {
  lastActivity = Date.now();
}

activityEvents.forEach((event) => {
  document.addEventListener(event, onActivity, { passive: true, capture: true });
});

// Visibility change detection
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    lastActivity = Date.now();
  }
  reportActivity();
});

// Periodic activity reporting
setInterval(reportActivity, ACTIVITY_REPORT_INTERVAL);

// Report on page load
reportActivity();
