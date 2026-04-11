(() => {
  const { DEFAULT_SYNC_STATE } = globalThis.ScrollHideConstants;

  const toPromise = (executor) =>
    new Promise((resolve, reject) => {
      executor((result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(result);
      });
    });

  const getSyncState = () =>
    toPromise((done) => chrome.storage.sync.get(DEFAULT_SYNC_STATE, done));

  const getSyncValue = (defaults) =>
    toPromise((done) => chrome.storage.sync.get(defaults, done));

  const setSyncValue = (value) =>
    toPromise((done) => chrome.storage.sync.set(value, done));

  globalThis.ScrollHideStorage = {
    getSyncState,
    getSyncValue,
    setSyncValue,
  };
})();
