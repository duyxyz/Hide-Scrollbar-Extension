export {};

declare function importScripts(...urls: string[]): void;

if (typeof importScripts === 'function') {
  importScripts(
    '/src/shared/constants.js',
    '/src/shared/storage.js',
    '/src/features/whitelist.js'
  );
}

const { BADGE_ACTIVE_COLOR, BADGE_INACTIVE_COLOR } = (globalThis as any).ScrollHideConstants || {
  BADGE_ACTIVE_COLOR: '#2772ed',
  BADGE_INACTIVE_COLOR: '#888',
};
const { getSyncState } = (globalThis as any).ScrollHideStorage || {};
const { isRestrictedUrl, isWhitelisted } = (globalThis as any).ScrollHideWhitelist || {};

// In-memory cache for Service Worker lifespan to avoid repeated storage disk/IPC reads
let cachedState: { scrollbarHidden: boolean; whitelist: string[] } | null = null;

const getCachedSyncState = async (): Promise<{ scrollbarHidden: boolean; whitelist: string[] }> => {
  if (cachedState) return cachedState;
  if (!getSyncState) return { scrollbarHidden: true, whitelist: [] };
  const state = await getSyncState();
  cachedState = {
    scrollbarHidden: state.scrollbarHidden !== false,
    whitelist: Array.isArray(state.whitelist) ? state.whitelist : [],
  };
  return cachedState;
};

const ICONS_ACTIVE = {
  16: '/assets/icons/icon16.png',
  32: '/assets/icons/icon32.png',
  48: '/assets/icons/icon48.png',
  128: '/assets/icons/icon128.png',
};

const ICONS_INACTIVE = {
  16: '/assets/icons/icon16-off.png',
  32: '/assets/icons/icon32-off.png',
  48: '/assets/icons/icon48-off.png',
  128: '/assets/icons/icon128-off.png',
};

const updateBadge = async (
  tabOrId: chrome.tabs.Tab | number | undefined,
  scrollbarHidden: boolean,
  whitelist: string[]
): Promise<void> => {
  if (tabOrId === undefined) return;
  let tabId: number | undefined;
  let tabUrl: string | undefined;

  if (typeof tabOrId === 'number') {
    tabId = tabOrId;
    try {
      const tab = await chrome.tabs.get(tabId);
      tabUrl = tab?.url;
    } catch (_) {
      tabUrl = undefined;
    }
  } else {
    tabId = tabOrId.id;
    tabUrl = tabOrId.url;
  }

  if (tabId === undefined) return;

  let restricted = false;
  let whitelisted = false;

  if (tabUrl) {
    restricted = isRestrictedUrl ? isRestrictedUrl(tabUrl) : false;
    if (!restricted && isWhitelisted) {
      try {
        whitelisted = isWhitelisted(new URL(tabUrl).hostname, whitelist);
      } catch (_) {
        whitelisted = false;
      }
    }
  } else {
    restricted = true;
  }

  // Clear badge text completely for a clean look
  chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});

  const active = !restricted && scrollbarHidden && !whitelisted;
  chrome.action.setIcon({
    path: active ? ICONS_ACTIVE : ICONS_INACTIVE,
    tabId,
  }).catch(() => {});
};

const updateBadgeForTab = async (tabId: number | undefined): Promise<void> => {
  if (tabId === undefined) return;
  const { scrollbarHidden, whitelist } = await getCachedSyncState();
  await updateBadge(tabId, scrollbarHidden, whitelist);
};

const updateAllBadges = async (): Promise<void> => {
  const { scrollbarHidden, whitelist } = await getCachedSyncState();
  chrome.action.setIcon({
    path: scrollbarHidden ? ICONS_ACTIVE : ICONS_INACTIVE,
  }).catch(() => {});
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => updateBadge(tab, scrollbarHidden, whitelist));
  });
};

const injectAllTabs = async (): Promise<void> => {
  const { scrollbarHidden, whitelist } = await getCachedSyncState();

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      updateBadge(tab, scrollbarHidden, whitelist);

      if (tab.id && tab.url && (!isRestrictedUrl || !isRestrictedUrl(tab.url)) && chrome.scripting) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'src/shared/constants.js',
            'src/shared/storage.js',
            'src/features/whitelist.js',
            'src/entries/content.js',
          ],
        }).catch(() => {});
      }
    });
  });
};

chrome.tabs.onActivated.addListener(({ tabId }) => updateBadgeForTab(tabId));

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading' || info.status === 'complete' || info.url) {
    updateBadgeForTab(tabId);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    cachedState = null; // Invalidate cache
    updateAllBadges();
  }
});

// Initialize tabs injection upon installation or update
chrome.runtime.onInstalled.addListener(() => {
  updateAllBadges().catch(() => {});
  injectAllTabs().catch(() => {});
});

// Run immediately whenever the service worker activates/wakes up
updateAllBadges().catch(() => {});

/* ── Keyboard Shortcuts & Messages ────────────────────────── */

const handleToggleScrollbar = async (): Promise<void> => {
  const syncData = await new Promise<{ scrollbarHidden?: boolean }>((resolve) => {
    chrome.storage.sync.get({ scrollbarHidden: true }, resolve);
  });
  const newState = !(syncData.scrollbarHidden ?? true);
  await chrome.storage.sync.set({ scrollbarHidden: newState });
  cachedState = null;
  updateAllBadges();
};

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-scrollbar') {
    handleToggleScrollbar();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.action === 'toggle-scrollbar') {
    handleToggleScrollbar();
  } else if (message && message.action === 'update-icons') {
    cachedState = null;
    updateAllBadges().catch(() => {});
  }
});

