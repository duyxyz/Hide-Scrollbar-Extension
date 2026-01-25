// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleScroll');
  const status = document.getElementById('statusText');

  // Load saved state
  chrome.storage.local.get({ scrollbarHidden: true }, (data) => {
    toggle.checked = data.scrollbarHidden;
    status.textContent = data.scrollbarHidden ? 'Active' : 'Inactive';
  });

  // Save on change
  toggle.addEventListener('change', () => {
    const hidden = toggle.checked;
    chrome.storage.local.set({ scrollbarHidden: hidden }, () => {
      status.textContent = hidden ? 'Active' : 'Inactive';
    });
  });
});