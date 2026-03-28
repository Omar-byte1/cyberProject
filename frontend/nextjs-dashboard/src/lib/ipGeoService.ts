// ---------------------------------------------------------------------------
// IP Geolocation Service – fetches real geo data from ipapi.co with caching
// ---------------------------------------------------------------------------

export interface IPGeoInfo {
  country: string;
  countryCode: string;
  city: string;
  org: string;
}

const UNKNOWN_GEO: IPGeoInfo = {
  country: 'Unknown',
  countryCode: '',
  city: 'Unknown',
  org: 'Unknown',
};

// Module-level cache – survives across renders but resets on full page reload.
const geoCache = new Map<string, IPGeoInfo>();

/**
 * Fetch geolocation info for a single IP address.
 * Results are cached so the same IP is never looked up twice.
 */
export async function fetchIPInfo(ip: string): Promise<IPGeoInfo> {
  // Return cached result immediately if available
  const cached = geoCache.get(ip);
  if (cached) return cached;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });

    if (!res.ok) {
      geoCache.set(ip, UNKNOWN_GEO);
      return UNKNOWN_GEO;
    }

    const data: unknown = await res.json();

    if (typeof data !== 'object' || data === null) {
      geoCache.set(ip, UNKNOWN_GEO);
      return UNKNOWN_GEO;
    }

    const json = data as Record<string, unknown>;

    // ipapi.co returns { error: true } for reserved / private IPs
    if (json.error === true) {
      geoCache.set(ip, UNKNOWN_GEO);
      return UNKNOWN_GEO;
    }

    const info: IPGeoInfo = {
      country: typeof json.country_name === 'string' ? json.country_name : 'Unknown',
      countryCode: typeof json.country_code === 'string' ? json.country_code : '',
      city: typeof json.city === 'string' ? json.city : 'Unknown',
      org: typeof json.org === 'string' ? json.org : 'Unknown',
    };

    geoCache.set(ip, info);
    return info;
  } catch {
    geoCache.set(ip, UNKNOWN_GEO);
    return UNKNOWN_GEO;
  }
}

/**
 * Fetch geolocation for multiple IPs in parallel.
 * Deduplicates automatically; leverages the in-memory cache.
 */
export async function fetchMultipleIPs(
  ips: string[],
): Promise<Map<string, IPGeoInfo>> {
  const unique = [...new Set(ips)];

  const results = await Promise.allSettled(
    unique.map(async (ip) => {
      const info = await fetchIPInfo(ip);
      return [ip, info] as const;
    }),
  );

  const map = new Map<string, IPGeoInfo>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [ip, info] = result.value;
      map.set(ip, info);
    }
  }
  return map;
}
