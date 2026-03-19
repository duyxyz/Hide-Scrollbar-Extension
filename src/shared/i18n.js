(() => {
  const applyI18n = () => {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const message = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
      if (!message) return;

      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.placeholder = message;
      } else {
        element.textContent = message;
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      const message = chrome.i18n.getMessage(element.getAttribute('data-i18n-title'));
      if (message) {
        element.title = message;
      }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const message = chrome.i18n.getMessage(element.getAttribute('data-i18n-aria-label'));
      if (message) {
        element.setAttribute('aria-label', message);
      }
    });
  };

  globalThis.ScrollHideI18n = { applyI18n };
})();
