// ---------------------------------------------------------------------------
// Country-code → flag emoji converter
// ---------------------------------------------------------------------------

/**
 * Convert a 2-letter ISO 3166-1 country code (e.g. "MA") to a flag emoji (🇲🇦).
 * Returns 🌐 for empty or invalid codes.
 */
export function countryCodeToFlag(code: string): string {
    if (!code || code.length !== 2) return '🌐';

    const upper = code.toUpperCase();
    const OFFSET = 0x1f1e6 - 'A'.charCodeAt(0);

    return String.fromCodePoint(
        upper.charCodeAt(0) + OFFSET,
        upper.charCodeAt(1) + OFFSET,
    );
}
