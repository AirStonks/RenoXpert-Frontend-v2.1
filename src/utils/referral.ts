const REF_COOKIE = 'rx_ref';
const REF_TTL_DAYS = 30;

/** Last-touch: always overwrite the cookie with the latest valid code. */
export function setReferralCookie(code: string): void {
    if (typeof document === 'undefined' || !code) return;
    const maxAge = REF_TTL_DAYS * 24 * 60 * 60;
    document.cookie = `${REF_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getReferralCode(): string | null {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp('(?:^|; )' + REF_COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

/** Read ?ref from a location.search string and store it (trimmed, uppercased). */
export function captureReferralFromUrl(search: string): void {
    if (typeof document === 'undefined' || !search) return;
    const ref = new URLSearchParams(search).get('ref');
    if (!ref) return;
    const code = ref.trim().toUpperCase();
    if (/^[A-Z0-9]{1,32}$/.test(code)) {
        setReferralCookie(code);
    }
}

/** Build a public campaign referral link. `base` is VITE_CAMPAIGN_URL (ends with '/'). */
export function buildReferralLink(base: string, slug: string, code: string): string {
    return `${base}campaigns/${slug}?ref=${encodeURIComponent(code)}`;
}

/** Public campaign base URL (mirrors CampaignDetail's CAMPAIGN_URL env logic). */
export function getCampaignBaseUrl(): string {
    const env = import.meta.env.VITE_APP_ENV;
    if (env === 'production') return import.meta.env.VITE_CAMPAIGN_URL || '';
    if (env === 'staging') return import.meta.env.VITE_STAGING_CAMPAIGN_URL || '';
    if (env === 'local') return 'localhost:5173/campaign/';
    return '';
}
