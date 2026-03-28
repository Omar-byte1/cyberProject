'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMultipleIPs, type IPGeoInfo } from '@/lib/ipGeoService';
import { countryCodeToFlag } from '@/lib/countryFlags';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertLike {
    log?: string;
}

export interface EnrichedIP {
    ip: string;
    country: string;
    city: string;
    org: string;
    flag: string;
    count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IP_REGEX = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;

function extractIPFromLog(log: string): string | null {
    const match = log.match(IP_REGEX);
    return match ? match[0] : null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook that extracts IPs from alert logs, fetches real geolocation
 * data, and returns an enriched, sorted list with a loading flag.
 */
export function useEnrichedIPs(alerts: AlertLike[]): {
    enrichedIPs: EnrichedIP[];
    isLoadingGeo: boolean;
} {
    const [geoMap, setGeoMap] = useState<Map<string, IPGeoInfo>>(new Map());
    const [isLoadingGeo, setIsLoadingGeo] = useState(false);

    // 1. Extract IPs and count occurrences (pure computation → useMemo)
    const ipCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const alert of alerts) {
            if (!alert.log) continue;
            const ip = extractIPFromLog(alert.log);
            if (!ip) continue;
            counts.set(ip, (counts.get(ip) ?? 0) + 1);
        }
        return counts;
    }, [alerts]);

    // 2. Stable key so the effect only re-runs when the unique IP set changes
    const ipSetKey = useMemo(() => {
        return [...ipCounts.keys()].sort().join(',');
    }, [ipCounts]);

    // 3. Fetch geo data when the set of unique IPs changes
    useEffect(() => {
        if (ipCounts.size === 0) {
            setGeoMap(new Map());
            return;
        }

        let cancelled = false;
        setIsLoadingGeo(true);

        fetchMultipleIPs([...ipCounts.keys()])
            .then((result) => {
                if (!cancelled) setGeoMap(result);
            })
            .catch(() => {
                /* errors already handled inside fetchMultipleIPs */
            })
            .finally(() => {
                if (!cancelled) setIsLoadingGeo(false);
            });

        return () => {
            cancelled = true;
        };
        // ipSetKey captures the actual IP list; ipCounts.size for the empty-check
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ipSetKey]);

    // 4. Merge geo data + counts into the enriched list
    const enrichedIPs: EnrichedIP[] = useMemo(() => {
        if (geoMap.size === 0 && ipCounts.size > 0) return []; // still loading

        const items: EnrichedIP[] = [];
        for (const [ip, count] of ipCounts) {
            const geo = geoMap.get(ip);
            items.push({
                ip,
                country: geo?.country ?? 'Unknown',
                city: geo?.city ?? 'Unknown',
                org: geo?.org ?? 'Unknown',
                flag: geo?.countryCode ? countryCodeToFlag(geo.countryCode) : '🌐',
                count,
            });
        }

        // Sort descending by count
        return items.sort((a, b) => b.count - a.count);
    }, [geoMap, ipCounts]);

    return { enrichedIPs, isLoadingGeo };
}
