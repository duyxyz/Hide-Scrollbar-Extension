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
        div[data-visualcompletion="ignore"][data-thumb="1"] { display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; }
      `;
      (document.head || document.documentElement).appendChild(style);
    } else if (!hide && style) {
      style.remove();
    }
  };

  const isWhitelisted = (whitelist) => {
    const hostname = window.location.hostname;
    
    // Exact match using Set for O(1) lookup
    const whitelistSet = new Set(whitelist);
    if (whitelistSet.has(hostname)) return true;
    
    // Suffix match for subdomains
    return whitelist.some(domain => hostname.endsWith('.' + domain));
  };

  const update = () => {
    chrome.storage.local.get(
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
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.scrollbarHidden || changes.whitelist)) update();
  });
})();