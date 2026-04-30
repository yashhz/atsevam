/**
 * ATSEVAM — Judge.me Rating Integration
 *
 * Setup:
 *   1. Add to your .env (or Shopify environment variables):
 *        JUDGEME_PUBLIC_TOKEN=your_public_token_here
 *        JUDGEME_SHOP_DOMAIN=your-store.myshopify.com
 *
 *   2. The functions here are called server-side inside Remix loaders only.
 *      They gracefully return null/empty when the token is not yet configured.
 *
 * Judge.me API docs: https://judge.me/api/v1
 */

export type JudgeMeRating = {
  rating: number;       // average rating (e.g. 4.7)
  reviewCount: number;  // total number of reviews
};

type JudgeMeBulkResult = Record<string, JudgeMeRating | null>;

// ─── Configuration ────────────────────────────────────────────────

function getConfig(env: Record<string, string | undefined>) {
  const token = env.JUDGEME_PUBLIC_TOKEN;
  const shopDomain = env.JUDGEME_SHOP_DOMAIN;
  return {token, shopDomain, configured: !!(token && shopDomain)};
}

// ─── Single Product ───────────────────────────────────────────────

/**
 * Fetches rating + review count for one product by its Shopify product ID.
 *
 * @param shopifyProductId  The full GID string, e.g. "gid://shopify/Product/12345"
 * @param env               The Remix context.env object
 * @returns JudgeMeRating or null if unconfigured / product has no reviews
 */
export async function fetchJudgeMeRating(
  shopifyProductId: string,
  env: Record<string, string | undefined>,
): Promise<JudgeMeRating | null> {
  const {token, shopDomain, configured} = getConfig(env);
  if (!configured) return null;

  // Extract numeric ID from GID
  const numericId = shopifyProductId.split('/').pop();
  if (!numericId) return null;

  try {
    const url = new URL('https://judge.me/api/v1/judgements/bulk_query_rating');
    url.searchParams.set('api_token', token!);
    url.searchParams.set('shop_domain', shopDomain!);
    url.searchParams.append('product_ids[]', numericId);

    const res = await fetch(url.toString(), {
      headers: {'Accept': 'application/json'},
      // Cache for 10 minutes — ratings don't change second-to-second
      // @ts-ignore - Cloudflare / Node fetch cache option
      cf: {cacheTtl: 600},
    });

    if (!res.ok) {
      console.warn(`[judgeme] API error ${res.status} for product ${numericId}`);
      return null;
    }

    const data = await res.json() as {
      reviews?: Array<{rating: number}>;
      rating?: number;
      reviewsCount?: number;
    };

    if (!data.rating && !data.reviews?.length) return null;

    const rating = data.rating ?? 0;
    const reviewCount = data.reviewsCount ?? data.reviews?.length ?? 0;
    if (!reviewCount) return null;

    return {rating: Math.round(rating * 10) / 10, reviewCount};
  } catch (err) {
    console.warn('[judgeme] fetch failed:', err);
    return null;
  }
}

// ─── Bulk Products (for collection/homepage grids) ─────────────────

/**
 * Fetches ratings for multiple products in a single API call.
 * Returns a map of { shopifyProductId → JudgeMeRating | null }.
 *
 * Uses Judge.me's bulk_query_rating endpoint to avoid N+1 API calls.
 *
 * @param products  Array of objects with at minimum { id: string } (Shopify GID)
 * @param env       The Remix context.env object
 */
export async function fetchJudgeMeRatingsBulk(
  products: Array<{id: string; handle?: string}>,
  env: Record<string, string | undefined>,
): Promise<JudgeMeBulkResult> {
  const {token, shopDomain, configured} = getConfig(env);
  if (!configured || products.length === 0) {
    // Return empty map — calling code should check for null
    return Object.fromEntries(products.map((p) => [p.id, null]));
  }

  // Map GIDs → numeric IDs, preserve mapping back
  const idMap: Record<string, string> = {};
  const numericIds: string[] = [];
  for (const p of products) {
    const numericId = p.id.split('/').pop();
    if (numericId) {
      numericIds.push(numericId);
      idMap[numericId] = p.id;
    }
  }

  if (numericIds.length === 0) {
    return Object.fromEntries(products.map((p) => [p.id, null]));
  }

  try {
    const url = new URL('https://judge.me/api/v1/judgements/bulk_query_rating');
    url.searchParams.set('api_token', token!);
    url.searchParams.set('shop_domain', shopDomain!);
    numericIds.forEach((id) => url.searchParams.append('product_ids[]', id));

    const res = await fetch(url.toString(), {
      headers: {'Accept': 'application/json'},
    });

    if (!res.ok) {
      console.warn(`[judgeme] Bulk API error ${res.status}`);
      return Object.fromEntries(products.map((p) => [p.id, null]));
    }

    // Judge.me bulk endpoint returns: { "12345": { rating: 4.7, count: 32 }, ... }
    const data = await res.json() as Record<
      string,
      {rating?: number; count?: number; reviewsCount?: number} | null
    >;

    const result: JudgeMeBulkResult = {};
    for (const [numericId, entry] of Object.entries(data)) {
      const gid = idMap[numericId];
      if (!gid) continue;
      if (!entry || !entry.rating) {
        result[gid] = null;
        continue;
      }
      const reviewCount = entry.reviewsCount ?? entry.count ?? 0;
      result[gid] = reviewCount > 0
        ? {rating: Math.round(entry.rating * 10) / 10, reviewCount}
        : null;
    }

    // Fill in any products that weren't in the response
    for (const p of products) {
      if (!(p.id in result)) result[p.id] = null;
    }

    return result;
  } catch (err) {
    console.warn('[judgeme] Bulk fetch failed:', err);
    return Object.fromEntries(products.map((p) => [p.id, null]));
  }
}

// ─── Helper: apply ratings to a product array ─────────────────────

/**
 * Convenience helper — merges fetched Judge.me ratings into any product array
 * that has the shape { id: string; rating?: number; reviewCount?: number }.
 */
export function applyRatings<T extends {id: string; rating?: number; reviewCount?: number}>(
  products: T[],
  ratings: JudgeMeBulkResult,
): T[] {
  return products.map((p) => {
    const r = ratings[p.id];
    if (!r) return p;
    return {...p, rating: r.rating, reviewCount: r.reviewCount};
  });
}
