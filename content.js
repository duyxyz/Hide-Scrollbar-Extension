// content.js — Injects CSS to hide scrollbars, respects whitelist
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

  const isWhitelisted = (whitelist) => {
    const hostname = window.location.hostname;
    return whitelist.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  };

  const update = () => {
    chrome.storage.sync.get(
      { scrollbarHidden: true, whitelist: [] },
      (res) => {
        if (chrome.runtime.lastError) return;
        applyStyle(res.scrollbarHidden && !isWhitelisted(res.whitelist));
      }
    );
  };

  // Initial check
  update();

  // React to storage changes in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.scrollbarHidden || changes.whitelist) update();
  });
})();