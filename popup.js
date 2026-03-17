// popup.js — Toggle + Whitelist management
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleScroll');
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const whitelistedNotice = document.getElementById('whitelistedNotice');
  const restrictedNotice = document.getElementById('restrictedNotice');
  
  const toggleWhitelist = document.getElementById('toggleWhitelist');
  const domainDisplay = document.getElementById('domainDisplay');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

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
    toggle.classList.remove('active');
    toggle.disabled = true;
    toggle.style.opacity = '0.4';
    toggle.style.pointerEvents = 'none';
    restrictedNotice.style.display = 'block';
    
    // Disable all bottom controls
    addCurrentBtn.disabled = true;
  };

  // --- Helpers -----------------------------------------------------------

  const isWhitelisted = (whitelist) => {
    // Exact match using Set for O(1) lookup
    const whitelistSet = new Set(whitelist);
    if (whitelistSet.has(currentHostname)) return true;
    
    // Suffix match for subdomains
    return whitelist.some(d => currentHostname.endsWith('.' + d));
  };

  const updateNotice = (whitelist) => {
    if (!currentHostname) {
      whitelistedNotice.style.display = 'none';
      domainDisplay.textContent = chrome.i18n.getMessage("cantAddPage") || 'Invalid Page';
      addCurrentBtn.disabled = true;
      return;
    }

    domainDisplay.textContent = currentHostname;

    const inList = isWhitelisted(whitelist);
    whitelistedNotice.style.display = inList ? 'block' : 'none';

    // Disable toggle when current site is whitelisted OR restricted
    if (inList || isRestricted) {
      toggle.classList.remove('active');
      toggle.disabled = true;
      toggle.style.opacity = '0.4';
      toggle.style.pointerEvents = 'none';
    } else {
      // Restore state from storage for non-whitelisted/non-restricted sites
      chrome.storage.sync.get({ scrollbarHidden: true }, (data) => {
        // Redundant check for safety
        if (isRestricted) return; 

        if (data.scrollbarHidden) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        toggle.disabled = false;
        toggle.style.opacity = '1';
        toggle.style.pointerEvents = 'auto';
      });
    }

    if (inList) {
      addCurrentBtn.disabled = true;
    } else {
      addCurrentBtn.disabled = false;
    }
  };

  const loadState = () => {
    chrome.storage.sync.get(
      { scrollbarHidden: true, whitelist: [] },
      (data) => {
        if (chrome.runtime.lastError) return;
        
        // Only set active if NOT restricted
        if (!isRestricted && data.scrollbarHidden) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        
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



  const addDomain = (raw) => {
    const domain = sanitizeDomain(raw);
    if (!domain) return;
    chrome.storage.sync.get({ whitelist: [] }, (data) => {
      if (chrome.runtime.lastError) return;
      if (data.whitelist.includes(domain)) return;
      const newList = [...data.whitelist, domain].sort();
      chrome.storage.sync.set({ whitelist: newList }, () => {
        updateNotice(newList);
      });
    });
  };

  // --- Event listeners ---------------------------------------------------

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const hidden = toggle.classList.contains('active');
    chrome.storage.sync.set({ scrollbarHidden: hidden }, () => {
      if (chrome.runtime.lastError) return;
    });
  });

  addCurrentBtn.addEventListener('click', () => {
    if (currentHostname) addDomain(currentHostname);
  });

  toggleWhitelist.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      if (chrome.sidePanel && chrome.sidePanel.open) {
        // Chromium
        await chrome.sidePanel.open({ tabId: tab.id });
      } else if (typeof browser !== 'undefined' && browser.sidebarAction && browser.sidebarAction.open) {
        // Firefox
        await browser.sidebarAction.open();
      } else if (chrome.sidebarAction && chrome.sidebarAction.open) {
        // Firefox polyfill behavior
        await chrome.sidebarAction.open();
      }
      window.close();
    }
  });

  // --- Export ---
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ scrollbarHidden: true, whitelist: [] }, (data) => {
      if (chrome.runtime.lastError) return;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scrollhide-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // --- Import ---
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.whitelist || !Array.isArray(data.whitelist)) return;

        chrome.storage.sync.get({ whitelist: [] }, (current) => {
          const merged = [...new Set([...current.whitelist, ...data.whitelist])].sort();
          
          chrome.storage.sync.set({ ...data, whitelist: merged }, () => {
            if (chrome.runtime.lastError) return;
            loadState(); // Refresh UI
          });
        });
      } catch (err) {
        console.error('Invalid JSON');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // --- Init --------------------------------------------------------------

  // Localize UI
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    if (msg) {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.placeholder = msg;
      } else {
        el.textContent = msg;
      }
    }
  });

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