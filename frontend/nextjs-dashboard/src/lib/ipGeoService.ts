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

const MOCK_IPS: Record<string, IPGeoInfo> = {
  "8.8.8.8": { country: "United States", countryCode: "US", city: "Mountain View", org: "Simulated Attacker" },
  "185.15.59.224": { country: "Russia", countryCode: "RU", city: "Moscow", org: "Simulated Attacker" },
  "103.22.200.0": { country: "China", countryCode: "CN", city: "Beijing", org: "Simulated Attacker" },
  "193.0.14.129": { country: "United Kingdom", countryCode: "GB", city: "London", org: "Simulated Attacker" },
  "177.71.128.1": { country: "Brazil", countryCode: "BR", city: "São Paulo", org: "Simulated Attacker" },
  "41.141.68.0": { country: "Morocco", countryCode: "MA", city: "Casablanca", org: "Simulated Attacker" },
  "120.136.54.0": { country: "India", countryCode: "IN", city: "New Delhi", org: "Simulated Attacker" },
  "1.1.1.1": { country: "Australia", countryCode: "AU", city: "Sydney", org: "Simulated Attacker" },
  "175.45.176.0": { country: "North Korea", countryCode: "KP", city: "Pyongyang", org: "Simulated Attacker" },
  "197.234.219.0": { country: "Nigeria", countryCode: "NG", city: "Lagos", org: "Simulated Attacker" }
};

/**
 * Fetch geolocation info for a single IP address.
 * Results are cached so the same IP is never looked up twice.
 */
export async function fetchIPInfo(ip: string): Promise<IPGeoInfo> {
  // 1. Check if it's one of our purely simulated IPs
  if (MOCK_IPS[ip]) {
    return MOCK_IPS[ip];
  }

  // 2. Return cached result immediately if available
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
