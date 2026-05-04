const DEFAULT_RULES = [
  // Work
  { pattern: "github.com", category: "Work", label: "GitHub" },
  { pattern: "gitlab.com", category: "Work", label: "GitLab" },
  { pattern: "bitbucket.org", category: "Work", label: "Bitbucket" },
  { pattern: "stackoverflow.com", category: "Work", label: "Stack Overflow" },
  { pattern: "jira.", category: "Work", label: "Jira" },
  { pattern: "confluence.", category: "Work", label: "Confluence" },
  { pattern: "slack.com", category: "Work", label: "Slack" },
  { pattern: "teams.microsoft.com", category: "Work", label: "Teams" },
  { pattern: "notion.so", category: "Work", label: "Notion" },
  { pattern: "linear.app", category: "Work", label: "Linear" },
  { pattern: "figma.com", category: "Work", label: "Figma" },
  { pattern: "vercel.com", category: "Work", label: "Vercel" },
  { pattern: "console.cloud.google", category: "Work", label: "Google Cloud" },
  { pattern: "console.aws.amazon", category: "Work", label: "AWS" },
  { pattern: "azure.microsoft.com", category: "Work", label: "Azure" },

  // Learning
  { pattern: "udemy.com", category: "Learning", label: "Udemy" },
  { pattern: "coursera.org", category: "Learning", label: "Coursera" },
  { pattern: "edx.org", category: "Learning", label: "edX" },
  { pattern: "khanacademy.org", category: "Learning", label: "Khan Academy" },
  { pattern: "leetcode.com", category: "Learning", label: "LeetCode" },
  { pattern: "hackerrank.com", category: "Learning", label: "HackerRank" },
  { pattern: "freecodecamp.org", category: "Learning", label: "freeCodeCamp" },
  { pattern: "medium.com", category: "Learning", label: "Medium" },
  { pattern: "dev.to", category: "Learning", label: "Dev.to" },
  { pattern: "docs.", category: "Learning", label: "Documentation" },
  { pattern: "developer.mozilla.org", category: "Learning", label: "MDN" },
  { pattern: "wikipedia.org", category: "Learning", label: "Wikipedia" },

  // Entertainment
  { pattern: "youtube.com", category: "Entertainment", label: "YouTube" },
  { pattern: "netflix.com", category: "Entertainment", label: "Netflix" },
  { pattern: "twitch.tv", category: "Entertainment", label: "Twitch" },
  { pattern: "reddit.com", category: "Entertainment", label: "Reddit" },
  { pattern: "9gag.com", category: "Entertainment", label: "9GAG" },
  { pattern: "imgur.com", category: "Entertainment", label: "Imgur" },
  { pattern: "primevideo.com", category: "Entertainment", label: "Prime Video" },
  { pattern: "disneyplus.com", category: "Entertainment", label: "Disney+" },
  { pattern: "hulu.com", category: "Entertainment", label: "Hulu" },

  // Social
  { pattern: "twitter.com", category: "Social", label: "Twitter/X" },
  { pattern: "x.com", category: "Social", label: "Twitter/X" },
  { pattern: "facebook.com", category: "Social", label: "Facebook" },
  { pattern: "instagram.com", category: "Social", label: "Instagram" },
  { pattern: "linkedin.com", category: "Social", label: "LinkedIn" },
  { pattern: "discord.com", category: "Social", label: "Discord" },
  { pattern: "whatsapp.com", category: "Social", label: "WhatsApp" },
  { pattern: "telegram.org", category: "Social", label: "Telegram" },
  { pattern: "threads.net", category: "Social", label: "Threads" },
  { pattern: "mastodon.", category: "Social", label: "Mastodon" },

  // Personal
  { pattern: "gmail.com", category: "Personal", label: "Gmail" },
  { pattern: "mail.google.com", category: "Personal", label: "Gmail" },
  { pattern: "outlook.live.com", category: "Personal", label: "Outlook" },
  { pattern: "calendar.google.com", category: "Personal", label: "Google Calendar" },
  { pattern: "drive.google.com", category: "Personal", label: "Google Drive" },
  { pattern: "amazon.com", category: "Personal", label: "Amazon" },
  { pattern: "ebay.com", category: "Personal", label: "eBay" },

  // Health
  { pattern: "myfitnesspal.com", category: "Health", label: "MyFitnessPal" },
  { pattern: "strava.com", category: "Health", label: "Strava" },
  { pattern: "fitbit.com", category: "Health", label: "Fitbit" },
  { pattern: "headspace.com", category: "Health", label: "Headspace" },
  { pattern: "calm.com", category: "Health", label: "Calm" },

  // Music (passive — tracked separately)
  { pattern: "spotify.com", category: "Music", label: "Spotify", passive: true },
  { pattern: "music.youtube.com", category: "Music", label: "YouTube Music", passive: true },
  { pattern: "music.apple.com", category: "Music", label: "Apple Music", passive: true },
  { pattern: "soundcloud.com", category: "Music", label: "SoundCloud", passive: true },
  { pattern: "pandora.com", category: "Music", label: "Pandora", passive: true },
];

export function categorizeUrl(url) {
  if (!url) return { category: "Other", label: "Unknown", passive: false };

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Check custom rules first (user-defined overrides)
    // Then check default rules
    for (const rule of DEFAULT_RULES) {
      if (hostname.includes(rule.pattern) || url.includes(rule.pattern)) {
        return {
          category: rule.category,
          label: rule.label,
          passive: rule.passive || false,
        };
      }
    }

    // Fallback: extract domain name as label
    const parts = hostname.replace("www.", "").split(".");
    const label = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    return { category: "Other", label, passive: false };
  } catch {
    return { category: "Other", label: "Unknown", passive: false };
  }
}

export async function loadCustomRules() {
  const result = await chrome.storage.sync.get("customRules");
  return result.customRules || [];
}

export async function saveCustomRules(rules) {
  await chrome.storage.sync.set({ customRules: rules });
}

export { DEFAULT_RULES };
