import {redirect, useLoaderData} from 'react-router';
import {useState, useMemo, useCallback} from 'react';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductCard} from '~/components/ProductCard';
import {ProductCardSkeleton} from '~/components/ui/Skeleton';
import {FilterSidebar, MobileFilterTrigger, MobileFilterDrawer} from '~/components/FilterSidebar';
import {Icon} from '~/components/ui/Icon';
import {
  MOCK_COLLECTION_PRODUCTS,
  MOCK_FILTERS,
  type MockProduct,
} from '~/lib/mock';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `Atsevam | ${data?.collection?.title ?? 'Collection'}`},
];

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 250}); // Increased from 24 to 250

  if (!handle) throw redirect('/collections');

  // Redirect common singular categories to their plural equivalents
  if (handle === 'kurti') throw redirect('/collections/kurtis');
  if (handle === 'lehenga') throw redirect('/collections/lehengas');
  if (handle === 'co-ord') throw redirect('/collections/co-ords');
  if (handle === 'anarkalis') throw redirect('/collections/anarkali'); // Anarkali is usually singular locally
  

  // Map collection handles to display names
  const getCategoryName = (collectionHandle: string): string => {
    const categoryMap: Record<string, string> = {
      'lehengas': 'Lehenga',
      'anarkali': 'Anarkali',
      'kurtis': 'Kurti',
      'co-ords': 'Co-ord Set',
      'bestsellers': 'Bestseller',
      'new-arrivals': 'New Arrival',
    };
    return categoryMap[collectionHandle.toLowerCase()] || 'Ethnic Wear';
  };

  // Try to fetch the specific collection
  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
    }),
  ]);

  // If collection doesn't exist, fetch all products instead
  if (!collection) {
    const {products} = await storefront.query(
      `#graphql
        query AllProducts($first: Int) {
          products(first: $first) {
            nodes {
              id
              handle
              title
              tags
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
          }
        }
      `,
      {variables: {first: 50}}
    );

    // Transform products
    const transformedProducts = products.nodes.map((product: any) => {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
        ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
        : undefined;
      
      // Determine badge based on tags and pricing
      let badge: 'new' | 'sale' | 'bestseller' | 'top-rated' | undefined;
      if (product.tags?.includes('new')) {
        badge = 'new';
      } else if (product.tags?.includes('bestseller')) {
        badge = 'bestseller';
      } else if (product.tags?.includes('top-rated')) {
        badge = 'top-rated';
      } else if (compareAtPrice && compareAtPrice > price) {
        badge = 'sale';
      }

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: `₹${Math.round(price).toLocaleString('en-IN')}`,
        compareAtPrice: compareAtPrice ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}` : undefined,
        featuredImage: {
          url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
          altText: product.featuredImage?.altText || product.title,
        },
        hoverImage: product.images?.nodes[1] ? {
          url: product.images.nodes[1].url,
          altText: product.images.nodes[1].altText || product.title,
        } : undefined,
        category: getCategoryName(handle),
        badge,
        rating: undefined,
        reviewCount: undefined,
        tags: product.tags || [], // Include tags for filtering
      };
    });

    // Build filters using our robust parse function
    const filters = parseFilters(products.nodes);

    return {
      collection: {
        id: 'all',
        handle: handle,
        title: handle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Browse our collection of handcrafted ethnic wear',
      },
      products: transformedProducts,
      filters,
    };
  }
  
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  // Transform products to match ProductCard structure
  const transformedProducts = collection.products.nodes.map((product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;
    
    // Determine badge based on tags and pricing
    let badge: 'new' | 'sale' | 'bestseller' | 'top-rated' | undefined;
    if (product.tags?.includes('new')) {
      badge = 'new';
    } else if (product.tags?.includes('bestseller')) {
      badge = 'bestseller';
    } else if (product.tags?.includes('top-rated')) {
      badge = 'top-rated';
    } else if (compareAtPrice && compareAtPrice > price) {
      badge = 'sale';
    }

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: `₹${Math.round(price).toLocaleString('en-IN')}`,
      compareAtPrice: compareAtPrice ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}` : undefined,
      featuredImage: {
        url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
        altText: product.featuredImage?.altText || product.title,
      },
      hoverImage: product.images?.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : undefined,
      category: getCategoryName(handle),
      badge,
      rating: undefined,
      reviewCount: undefined,
      tags: product.tags || [], // Include tags for filtering
    };
  });

  // Build filters using our robust parse function
  const filters = parseFilters(collection.products.nodes);
  
  console.log('🔍 DEBUG: Generated filters:', filters);
  console.log('🔍 DEBUG: Filters as JSON:', JSON.stringify(filters, null, 2));

  return {
    collection: {
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
    },
    products: transformedProducts,
    filters,
  };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

// ─── Sort options ─────────────────────────────────────────────────

const SORT_OPTIONS = [
  {value: 'featured',    label: 'Featured'},
  {value: 'newest',      label: 'Newest First'},
  {value: 'price-asc',   label: 'Price: Low to High'},
  {value: 'price-desc',  label: 'Price: High to Low'},
  {value: 'top-rated',   label: 'Top Rated'},
];

// ─── Page ─────────────────────────────────────────────────────────

export default function Collection() {
  const {collection, products: allProducts, filters} = useLoaderData<typeof loader>();
  
  // CLIENT-SIDE DEBUG - You should see this in browser console
  console.log('🔍 CLIENT: Filters received:', filters);
  console.log('🔍 CLIENT: Number of filters:', filters?.length);
  console.log('🔍 CLIENT: All products count:', allProducts?.length);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFilter = useCallback((groupId: string, value: string) => {
    setIsUpdating(true);
    setActiveFilters((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {...prev, [groupId]: next};
    });
    // Reset updating state after transition
    setTimeout(() => setIsUpdating(false), 300);
  }, []);

  const clearAll = useCallback(() => {
    setIsUpdating(true);
    setActiveFilters({});
    setTimeout(() => setIsUpdating(false), 300);
  }, []);

  // Client-side filter + sort
  const products = useMemo(() => {
    let result = [...allProducts];

    // Apply filters - check actual product tags with prefixes
    Object.entries(activeFilters).forEach(([groupId, values]) => {
      if (values.length > 0) {
        result = result.filter((p) => {
          // Get the product's actual tags from Shopify
          const productTags = (p as any).tags || [];
          
          // Check if product has any of the selected filter values
          return values.some(filterValue => {
            // We mapped options to have exact tag as `value` without prefix,
            // but we must check using the appropriate prefix format
            return productTags.some((tag: string) => {
              const tagLower = tag.toLowerCase();
              if (groupId === 'tag') {
                return tagLower === filterValue.toLowerCase();
              }
              const expectedCol = `${groupId}:${filterValue}`.toLowerCase();
              const expectedScore = `${groupId}_${filterValue}`.toLowerCase();
              return tagLower === expectedCol || tagLower === expectedScore;
            });
          });
        });
      }
    });

    // Sort
    if (sortBy === 'newest')     result = result.filter((p) => p.badge === 'new').concat(result.filter((p) => p.badge !== 'new'));
    if (sortBy === 'price-asc')  result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sortBy === 'price-desc') result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sortBy === 'top-rated')  result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return result;
  }, [allProducts, activeFilters, sortBy]);

  const activeCount = Object.values(activeFilters).flat().length;

  return (
    <div className="av-collection">
      {/* Breadcrumb */}
      <div className="av-breadcrumb container">
        <a href="/" className="av-breadcrumb__item">Home</a>
        <span className="av-breadcrumb__sep">/</span>
        <span className="av-breadcrumb__item av-breadcrumb__item--active">
          {collection.title}
        </span>
      </div>

      {/* Collection header */}
      <div className="av-collection__header container">
        <div>
          <h1 className="av-collection__title">{collection.title}</h1>
          {collection.description && (
            <p className="av-collection__desc">{collection.description}</p>
          )}
        </div>
        <p className="av-collection__count">{products.length} products</p>
      </div>

      {/* Active filter chips - mobile only, above toolbar */}
      {activeCount > 0 && (
        <div className="av-collection__active-filters container">
          <div className="av-filter-chips av-filter-chips--mobile">
            {Object.entries(activeFilters).flatMap(([groupId, values]) =>
              values.map((val) => {
                const group = filters.find((f) => f.id === groupId);
                const opt = group?.options.find((o) => o.value === val);
                return (
                  <button
                    key={`${groupId}-${val}`}
                    className="av-filter-chip"
                    onClick={() => toggleFilter(groupId, val)}
                  >
                    {opt?.label ?? val}
                    <Icon name="close" size={12} strokeWidth={2} />
                  </button>
                );
              })
            )}
            <button className="av-filter-chip-clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Toolbar — sort + layout + mobile filter */}
      <div className="av-collection__toolbar container">
        <MobileFilterTrigger
          activeCount={activeCount}
          onClick={() => setMobileFilterOpen(true)}
        />

        <div className="av-collection__toolbar-right">
          {/* Layout toggle */}
          <div className="av-layout-toggle">
            <button
              className={`av-layout-toggle__btn${layout === 'grid' ? ' active' : ''}`}
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
            >
              <Icon name="menu" size={16} strokeWidth={1.5} />
            </button>
            <button
              className={`av-layout-toggle__btn${layout === 'list' ? ' active' : ''}`}
              onClick={() => setLayout('list')}
              aria-label="List view"
            >
              <Icon name="arrow-right" size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Sort */}
          <div className="av-sort">
            <label className="av-sort__label" htmlFor="sort-select">Sort</label>
            <select
              id="sort-select"
              className="av-sort__select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} strokeWidth={1.5} className="av-sort__icon" />
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="av-collection__body container">
        {/* Sticky filter sidebar — desktop only */}
        <div className="av-collection__sidebar">
          <FilterSidebar
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={toggleFilter}
            onClearAll={clearAll}
            totalCount={products.length}
          />
        </div>

        {/* Product grid */}
        <div className="av-collection__grid-wrap">
          {products.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <div className={`av-collection__grid av-collection__grid--${layout}${isUpdating ? ' updating' : ''}`}>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 6 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={toggleFilter}
        onClearAll={clearAll}
        totalCount={products.length}
      />

      <Analytics.CollectionView
        data={{collection: {id: collection.id, handle: collection.handle}}}
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────

function EmptyState({onClear}: {onClear: () => void}) {
  return (
    <div className="av-collection__empty">
      <p className="av-collection__empty-title">No products found</p>
      <p className="av-collection__empty-sub">
        Try adjusting your filters to find what you're looking for.
      </p>
      <button className="btn btn-secondary" onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function parsePrice(price: string): number {
  return Number(price.replace(/[₹,\s]/g, '')) || 0;
}

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

  // Group tags
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

      if (!tagsByPrefix[prefix]) {
        tagsByPrefix[prefix] = new Set();
      }
      tagsByPrefix[prefix].add(value);
    });
  });

  // Calculate counts and format output
  return Object.keys(tagsByPrefix)
    // Only sort known configured prefixes first
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
        .map((value: string) => {
          return {
            value: value, 
            label: value,
            count: productsNodes.filter((p: any) => {
              const productTags = p.tags || [];
              return productTags.some((t: string) => {
                const tLower = t.toLowerCase();
                const expectedCol = `${prefix}:${value}`.toLowerCase();
                const expectedScore = `${prefix}_${value}`.toLowerCase();
                if (prefix === 'tag') {
                   return tLower === value.toLowerCase();
                }
                return tLower === expectedCol || tLower === expectedScore;
              });
            }).length,
          };
        }),
    }));
}

// ─── GraphQL ──────────────────────────────────────────────────────

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
        nodes {
          id
          handle
          title
          tags
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
  }
` as const;
