/**
 * Shopify CDN serves the original upload (often 2-5 MB) unless a width is
 * requested. Phones — especially low-RAM Android devices — struggle to decode
 * a grid of those, so always ask the CDN for a right-sized rendition.
 * Non-Shopify URLs (local /images/*, placeholders) are returned untouched.
 */
const SHOPIFY_CDN = 'cdn.shopify.com';

export function shopifyImage(url: string | undefined, width: number): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== SHOPIFY_CDN) return url;
    parsed.searchParams.set('width', String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function shopifyImageSrcSet(
  url: string | undefined,
  widths: number[],
): string | undefined {
  if (!url) return undefined;
  try {
    if (new URL(url).hostname !== SHOPIFY_CDN) return undefined;
  } catch {
    return undefined;
  }
  return widths.map((w) => `${shopifyImage(url, w)} ${w}w`).join(', ');
}
