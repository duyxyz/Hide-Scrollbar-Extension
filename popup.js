// popup.js — Toggle + Whitelist management
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleScroll');
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const whitelistTextarea = document.getElementById('whitelistTextarea');
  const whitelistedNotice = document.getElementById('whitelistedNotice');
  const restrictedNotice = document.getElementById('restrictedNotice');
  const exceptionCount = document.getElementById('exceptionCount');

  let currentHostname = '';
  let isRestricted = false;

  const RESTRICTED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'devtools:'];

  const checkRestricted = (url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      if (RESTRICTED_PROTOCOLS.includes(parsed.protocol)) return true;
      if (parsed.hostname === 'chrome.google.com') return true;
    } catch (_) {
      return true;
    }
    return false;
  };

  const applyRestrictedState = () => {
    toggle.disabled = true;
    toggle.parentElement.style.opacity = '0.4';
    toggle.parentElement.style.pointerEvents = 'none';
    restrictedNotice.style.display = 'block';
    addCurrentBtn.style.display = 'none';
  };

  // --- Helpers -----------------------------------------------------------

  const isWhitelisted = (whitelist) =>
    whitelist.some(
      (d) => currentHostname === d || currentHostname.endsWith('.' + d)
    );

  const renderWhitelist = (whitelist) => {
    exceptionCount.textContent = whitelist.length === 0 ? 'none' : whitelist.length;
    whitelistTextarea.value = whitelist.join('\n');
  };

  const updateNotice = (whitelist) => {
    if (!currentHostname) {
      whitelistedNotice.style.display = 'none';
      addCurrentBtn.disabled = true;
      addCurrentBtn.textContent = 'Can\'t add this page';
      return;
    }

    const inList = isWhitelisted(whitelist);
    whitelistedNotice.style.display = inList ? 'block' : 'none';

    // Disable toggle when current site is whitelisted
    toggle.disabled = inList;
    toggle.parentElement.style.opacity = inList ? '0.4' : '1';
    toggle.parentElement.style.pointerEvents = inList ? 'none' : 'auto';

    if (inList) {
      addCurrentBtn.disabled = true;
      addCurrentBtn.textContent = '✓ Already in exception list';
    } else {
      addCurrentBtn.disabled = false;
      addCurrentBtn.textContent = currentHostname;
    }
  };

  const loadState = () => {
    chrome.storage.local.get(
      { scrollbarHidden: true, whitelist: [] },
      (data) => {
        if (chrome.runtime.lastError) return;
        toggle.checked = data.scrollbarHidden;
        renderWhitelist(data.whitelist);
        updateNotice(data.whitelist);
      }
    );
  };

  // --- Domain add / remove -----------------------------------------------

  const sanitizeDomain = (raw) =>
    raw
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '');

  const saveWhitelistFromTextarea = () => {
    const rawText = whitelistTextarea.value;
    const domains = rawText.split('\n')
      .map(sanitizeDomain)
      .filter(d => d);

    const uniqueDomains = [...new Set(domains)].sort();

    chrome.storage.local.set({ whitelist: uniqueDomains }, () => {
      if (chrome.runtime.lastError) return;
      updateNotice(uniqueDomains);
      exceptionCount.textContent = uniqueDomains.length === 0 ? 'none' : uniqueDomains.length;
    });
  };

  const addDomain = (raw) => {
    const domain = sanitizeDomain(raw);
    if (!domain) return;
    chrome.storage.local.get({ whitelist: [] }, (data) => {
      if (chrome.runtime.lastError) return;
      if (data.whitelist.includes(domain)) return;
      const newList = [...data.whitelist, domain].sort();
      chrome.storage.local.set({ whitelist: newList }, () => {
        renderWhitelist(newList);
        updateNotice(newList);
      });
    });
  };

  // --- Event listeners ---------------------------------------------------

  toggle.addEventListener('change', () => {
    const hidden = toggle.checked;
    chrome.storage.local.set({ scrollbarHidden: hidden }, () => {
      if (chrome.runtime.lastError) return;
    });
  });

  addCurrentBtn.addEventListener('click', () => {
    if (currentHostname) addDomain(currentHostname);
  });

  whitelistTextarea.addEventListener('input', () => {
    saveWhitelistFromTextarea();
  });

  // --- Init --------------------------------------------------------------

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabUrl = tabs[0]?.url || '';
    isRestricted = checkRestricted(tabUrl);

    if (!isRestricted && tabUrl) {
      try {
        currentHostname = new URL(tabUrl).hostname;
      } catch (_) {
        /* fallback */
      }
    }

    if (isRestricted) {
      applyRestrictedState();
    }

    loadState();
  });
});