// background.js — Service Worker: Badge icon management
const RESTRICTED = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'devtools:'];
const RESTRICTED_HOSTS = ['chrome.google.com', 'chromewebstore.google.com'];

const updateBadge = async (tabId, scrollbarHidden, whitelist) => {
    let isWhitelisted = false;
    let restricted = false;

    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
            const parsed = new URL(tab.url);
            if (RESTRICTED.includes(parsed.protocol) || RESTRICTED_HOSTS.includes(parsed.hostname)) {
                restricted = true;
            } else {
                const hostname = parsed.hostname;
                isWhitelisted = whitelist.some(
                    (d) => hostname === d || hostname.endsWith('.' + d)
                );
            }
        }
    } catch (_) {
        restricted = true;
    }

    if (restricted) {
        chrome.action.setBadgeText({ text: '', tabId });
        return;
    }

    const active = scrollbarHidden && !isWhitelisted;
    chrome.action.setBadgeText({ text: active ? 'ON' : 'OFF', tabId });
    chrome.action.setBadgeBackgroundColor({
        color: active ? '#007aff' : '#888',
        tabId,
    });
};

const updateBadgeForTab = async (tabId) => {
    const { scrollbarHidden = true, whitelist = [] } =
        await chrome.storage.sync.get(['scrollbarHidden', 'whitelist']);
    await updateBadge(tabId, scrollbarHidden, whitelist);
};

// Update ALL tabs when the user changes settings or whitelist
const updateAllTabs = async () => {
    const { scrollbarHidden = true, whitelist = [] } =
        await chrome.storage.sync.get(['scrollbarHidden', 'whitelist']);
    
    // Sync to local storage for faster content script access
    await chrome.storage.local.set({ scrollbarHidden, whitelist });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((t) => updateBadge(t.id, scrollbarHidden, whitelist));
    });
};

// Update badge when switching tabs
chrome.tabs.onActivated.addListener(({ tabId }) => updateBadgeForTab(tabId));

// Update badge when a tab finishes loading (URL may have changed)
chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === 'complete') updateBadgeForTab(tabId);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') updateAllTabs();
});

chrome.runtime.onStartup.addListener(updateAllTabs);

// Set correct badge on every tab when extension is installed / reloaded
chrome.runtime.onInstalled.addListener(updateAllTabs);

updateAllTabs().catch(() => {});
