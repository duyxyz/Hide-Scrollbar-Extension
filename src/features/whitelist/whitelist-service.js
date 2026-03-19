(() => {
  const { RESTRICTED_HOSTS, RESTRICTED_PROTOCOLS } = globalThis.ScrollHideConstants;

  const sanitizeDomain = (raw) =>
    String(raw)
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?/, '')
      .replace(/\/.*$/, '');

  const normalizeWhitelist = (domains) =>
    [...new Set(
      (Array.isArray(domains) ? domains : [])
        .map((domain) => sanitizeDomain(domain))
        .filter(Boolean)
    )].sort();

  const serializeDomains = (domains) => normalizeWhitelist(domains).join('\n');

  const isWhitelisted = (hostname, whitelist) => {
    if (!hostname) return false;
    const whitelistSet = new Set(whitelist);
    return whitelistSet.has(hostname);
  };

  const isRestrictedUrl = (url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return RESTRICTED_PROTOCOLS.includes(parsed.protocol) || RESTRICTED_HOSTS.includes(parsed.hostname);
    } catch (_) {
      return true;
    }
  };

  globalThis.ScrollHideWhitelist = {
    isRestrictedUrl,
    isWhitelisted,
    normalizeWhitelist,
    sanitizeDomain,
    serializeDomains,
  };
})();
