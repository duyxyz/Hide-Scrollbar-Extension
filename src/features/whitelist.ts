const getConstants = () => {
  const g = globalThis as unknown as { ScrollHideConstants?: { RESTRICTED_HOSTS: string[]; RESTRICTED_PROTOCOLS: string[] } };
  return g.ScrollHideConstants || {
    RESTRICTED_HOSTS: [] as string[],
    RESTRICTED_PROTOCOLS: [
      'chrome:',
      'chrome-extension:',
      'edge:',
      'about:',
      'view-source:',
      'devtools:',
    ],
  };
};

export const sanitizeDomain = (raw: unknown): string => {
  let str = String(raw || '').trim().toLowerCase();
  if (!str || str.startsWith('!') || str.startsWith('#')) return '';

  const hasWildcard = str.startsWith('*.') || str.startsWith('*');
  str = str
    .replace(/^[a-zA-Z]+:\/\//, '')
    .replace(/^.*@/, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '');

  str = str.replace(/^\*+\.?/, '');
  if (!str) return '';
  return hasWildcard ? `*.${str}` : str;
};

export const normalizeWhitelist = (domains: unknown): string[] =>
  [...new Set(
    (Array.isArray(domains) ? domains : [])
      .map((domain) => sanitizeDomain(domain))
      .filter(Boolean)
  )].sort();

export const serializeDomains = (domains: unknown): string =>
  normalizeWhitelist(domains).join('\n');

let cachedWhitelist: unknown = null;
let cachedSet = new Set<string>();

export const isWhitelisted = (hostname: string | null | undefined, whitelist: string[] | unknown): boolean => {
  if (!hostname) return false;
  const cleanHost = String(hostname).toLowerCase().replace(/:\d+$/, '').trim();
  if (!cleanHost) return false;

  if (whitelist !== cachedWhitelist) {
    cachedWhitelist = whitelist;
    cachedSet = new Set(
      (Array.isArray(whitelist) ? (whitelist as string[]) : [])
        .map((d) => sanitizeDomain(d))
        .filter(Boolean)
    );
  }

  // 1. Exact match (e.g., mail.google.com === mail.google.com)
  if (cachedSet.has(cleanHost)) return true;

  // 2. www alias match: www.domain.com <-> domain.com
  const withoutWww = cleanHost.startsWith('www.') ? cleanHost.slice(4) : null;
  const withWww = cleanHost.startsWith('www.') ? null : `www.${cleanHost}`;
  if (withoutWww && cachedSet.has(withoutWww)) return true;
  if (withWww && cachedSet.has(withWww)) return true;

  // 3. Exact apex domain matching a wildcard rule (*.google.com matches google.com)
  if (cachedSet.has(`*.${cleanHost}`)) return true;

  // 4. Wildcard subdomain match: ONLY matches if user explicitly added a wildcard rule (*.domain)
  // e.g., cleanHost "mail.google.com" matches "*.google.com", but DOES NOT match plain "google.com"
  const parts = cleanHost.split('.');
  while (parts.length > 1) {
    parts.shift();
    const wildcardRule = `*.${parts.join('.')}`;
    if (cachedSet.has(wildcardRule)) return true;
  }

  return false;
};

export const isRestrictedUrl = (url: string | null | undefined): boolean => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const { RESTRICTED_HOSTS, RESTRICTED_PROTOCOLS } = getConstants();
    return RESTRICTED_PROTOCOLS.includes(parsed.protocol) || RESTRICTED_HOSTS.includes(parsed.hostname);
  } catch (_) {
    return true;
  }
};

export const ScrollHideWhitelist = {
  isRestrictedUrl,
  isWhitelisted,
  normalizeWhitelist,
  sanitizeDomain,
  serializeDomains,
};

// Global assignment for HTML script tags
(globalThis as unknown as { ScrollHideWhitelist: typeof ScrollHideWhitelist }).ScrollHideWhitelist = ScrollHideWhitelist;
