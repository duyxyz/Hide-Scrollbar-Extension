// content.js
(function () {
  const STYLE_ID = 'hide-scrollbar-style';

  const applyStyle = (hide) => {
    let style = document.getElementById(STYLE_ID);
    if (hide && !style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      `;
      (document.head || document.documentElement).appendChild(style);
    } else if (!hide && style) {
      style.remove();
    }
  };

  // Sync state
  chrome.storage.local.get({ scrollbarHidden: true }, (res) => applyStyle(res.scrollbarHidden));
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.scrollbarHidden) applyStyle(changes.scrollbarHidden.newValue);
  });
})();