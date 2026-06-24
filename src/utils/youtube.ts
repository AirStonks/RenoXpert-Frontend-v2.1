/**
 * Return a YouTube embed URL for the common link forms (watch, youtu.be,
 * shorts, embed), or null if the input is empty / not a recognised YouTube URL.
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const patterns = [
        /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/,
        /youtube\.com\/shorts\/([\w-]{11})/,
        /youtube\.com\/embed\/([\w-]{11})/,
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}`;
    }
    return null;
}
