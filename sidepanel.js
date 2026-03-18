const textarea = document.getElementById('whitelistTextarea');
const saveStatus = document.getElementById('saveStatus');

const sanitizeDomain = (raw) =>
  raw.trim().toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '');

const normalizeWhitelist = (domains) =>
  [...new Set((domains || []).map(sanitizeDomain).filter((domain) => domain))].sort();

const serializeDomains = (domains) => normalizeWhitelist(domains).join('\n');

let lastSavedValue = '';
let lastKnownStorageValue = '';

const renderWhitelist = (domains) => {
  const nextValue = serializeDomains(domains);
  textarea.value = nextValue;
  lastSavedValue = nextValue;
  lastKnownStorageValue = nextValue;
};

const save = () => {
  const draftDomains = normalizeWhitelist(textarea.value.split('\n'));

  chrome.storage.sync.get({ whitelist: [] }, (data) => {
    if (chrome.runtime.lastError) {
      saveStatus.textContent = chrome.i18n.getMessage("error") || 'Error';
      return;
    }

    const remoteValue = serializeDomains(data.whitelist);
    const nextDomains = remoteValue === lastKnownStorageValue
      ? draftDomains
      : normalizeWhitelist([...data.whitelist, ...draftDomains]);

    if (remoteValue !== lastKnownStorageValue) {
      renderWhitelist(nextDomains);
    }

    chrome.storage.sync.set({ whitelist: nextDomains }, () => {
      if (chrome.runtime.lastError) {
        saveStatus.textContent = chrome.i18n.getMessage("error") || 'Error';
        return;
      }
      lastSavedValue = serializeDomains(nextDomains);
      lastKnownStorageValue = lastSavedValue;
      saveStatus.textContent = chrome.i18n.getMessage("saved") || 'Saved';
      setTimeout(() => saveStatus.textContent = '', 1500);
    });
  });
};

// Load
chrome.storage.sync.get({ whitelist: [] }, (data) => {
  if (!chrome.runtime.lastError) {
    renderWhitelist(data.whitelist);
  }
});

// Save on input
let t;
textarea.addEventListener('input', () => {
  saveStatus.textContent = chrome.i18n.getMessage("saving") || 'Saving...';
  clearTimeout(t);
  t = setTimeout(save, 500);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync' || !changes.whitelist) return;

  const nextDomains = changes.whitelist.newValue || [];
  const nextValue = serializeDomains(nextDomains);
  lastKnownStorageValue = nextValue;

  if (textarea.value === lastSavedValue || textarea.value === nextValue) {
    renderWhitelist(nextDomains);
  }
});

// Init Localization
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
