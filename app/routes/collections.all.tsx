import {redirect} from 'react-router';
import type {Route} from './+types/collections.all';

/**
 * /collections/all → redirect to /collections/all handled by $handle route
 * This ensures the "Retail" page uses the same styled grid + filters
 * as every other collection page.
 */
export async function loader({context, params, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);

  // Fetch all products using the "all" pseudo-collection
  // The $handle route already handles the case where a collection
  // doesn't exist by falling back to all products. So we simply
  // let it pass through by NOT redirecting and instead re-using
  // the $handle loader logic.

  // However, since the route file `collections.all.tsx` takes
  // priority over `collections.$handle.tsx` for the path
  // `/collections/all`, we need to explicitly handle it here
  // with the same styled approach.

  const {getPaginationVariables} = await import('@shopify/hydrogen');
  const paginationVariables = getPaginationVariables(request, {pageBy: 250});

  // Fetch all products
  const {products} = await storefront.query(
    `#graphql
      query AllProducts($first: Int, $last: Int, $startCursor: String, $endCursor: String) {
        products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
          nodes {
            id
            handle
            title
            tags
            productType
            featuredImage { 
              id 
              altText 
              url 
              width 
              height 
            }
            images(first: 2) {
              nodes {
                url
                altText
              }
            }
            priceRange {
              minVariantPrice { 
                amount 
                currencyCode 
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
          pageInfo {
            hasPreviousPage
            hasNextPage
            endCursor
            startCursor
          }
        }
      }
    `,
    {variables: {...paginationVariables}}
  );

  const transformedProducts = products.nodes.map((product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;
    
    let badge: 'new' | 'sale' | 'bestseller' | 'top-rated' | undefined;
    if (product.tags?.includes('new')) badge = 'new';
    else if (product.tags?.includes('bestseller')) badge = 'bestseller';
    else if (product.tags?.includes('top-rated')) badge = 'top-rated';
    else if (compareAtPrice && compareAtPrice > price) badge = 'sale';

    let category = 'Ethnic Wear';
    if (product.productType) {
      category = product.productType;
    }

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: `₹${Math.round(price).toLocaleString('en-IN')}`,
      compareAtPrice: compareAtPrice ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}` : undefined,
      discount: compareAtPrice && compareAtPrice > price
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : undefined,
      featuredImage: {
        url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
        altText: product.featuredImage?.altText || product.title,
      },
      hoverImage: product.images?.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : undefined,
      category,
      badge,
      rating: undefined,
      reviewCount: undefined,
      tags: product.tags || [],
    };
  });

  const filters = parseFilters(products.nodes);

  return {
    collection: {
      id: 'all',
      handle: 'all',
      title: 'All Products',
      description: 'Browse our complete collection of handcrafted ethnic wear',
    },
    products: transformedProducts,
    filters,
  };
}

export {default, meta} from './collections.$handle';

// ─── Helpers ──────────────────────────────────────────────────────

function parseFilters(productsNodes: any[]) {
  const tagsByPrefix: Record<string, Set<string>> = {};
  const filterConfig: Record<string, string> = {
    'color': 'Color',
    'fabric': 'Fabric',
    'work': 'Work Type',
    'stitching': 'Stitching',
    'sleeve': 'Sleeve',
    'neck': 'Neck Type',
    'set': 'Set Type',
    'size': 'Size',
    'tag': 'Tags',
  };

  productsNodes.forEach((p: any) => {
    (p.tags || []).forEach((rawTag: string) => {
      const tag = rawTag.trim();
      let prefix = 'tag';
      let value = tag;

      if (tag.includes(':')) {
        const parts = tag.split(':');
        prefix = parts[0].trim().toLowerCase();
        value = parts.slice(1).join(':').trim();
      } else if (tag.includes('_')) {
        const parts = tag.split('_');
        prefix = parts[0].trim().toLowerCase();
        value = parts.slice(1).join('_').trim();
      }

      if (!tagsByPrefix[prefix]) tagsByPrefix[prefix] = new Set();
      tagsByPrefix[prefix].add(value);
    });
  });

  return Object.keys(tagsByPrefix)
    .sort((a, b) => {
      const iA = Object.keys(filterConfig).indexOf(a);
      const iB = Object.keys(filterConfig).indexOf(b);
      if (iA >= 0 && iB >= 0) return iA - iB;
      if (iA >= 0) return -1;
      if (iB >= 0) return 1;
      return a.localeCompare(b);
    })
    .map((prefix) => ({
      id: prefix,
      label: filterConfig[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1),
      options: Array.from(tagsByPrefix[prefix])
        .sort()
        .map((value: string) => ({
          value,
          label: value,
          count: productsNodes.filter((p: any) => {
            const productTags = p.tags || [];
            return productTags.some((t: string) => {
              const tLower = t.toLowerCase();
              const expectedCol = `${prefix}:${value}`.toLowerCase();
              const expectedScore = `${prefix}_${value}`.toLowerCase();
              if (prefix === 'tag') return tLower === value.toLowerCase();
              return tLower === expectedCol || tLower === expectedScore;
            });
          }).length,
        })),
    }));
}
