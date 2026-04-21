import {redirect, useLoaderData} from 'react-router';
import {useState, useMemo, useCallback} from 'react';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductCard} from '~/components/ProductCard';
import {FilterSidebar, MobileFilterTrigger, MobileFilterDrawer} from '~/components/FilterSidebar';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = ({data}) => {
  const collection = data?.collection;
  const title = collection?.title || 'Collection';
  const handle = collection?.handle || '';
  
  // Category-specific descriptions
  const descriptions: Record<string, string> = {
    'lehengas': 'Shop premium bridal and festive lehengas at Atsevam. Handcrafted with intricate embroidery, zari work, and traditional craftsmanship. Perfect for weddings, receptions, and special occasions.',
    'anarkali': 'Explore elegant Anarkali suits and dresses. Designer Anarkali collection with beautiful embroidery and premium fabrics. Perfect for festive occasions and celebrations.',
    'kurtis': 'Browse designer kurtis and kurtas for women. Comfortable, stylish ethnic wear perfect for daily wear and casual occasions. Premium fabrics with modern designs.',
    'co-ords': 'Trendy co-ord sets and matching sets. Modern ethnic wear with contemporary designs. Perfect for parties, casual outings, and festive occasions.',
    'western-dresses': 'Shop western dresses, tops, and tunics. Modern fashion with elegant designs. Perfect for parties and casual wear.',
    'sarees': 'Traditional sarees with modern designs. Premium fabrics and beautiful drapes. Perfect for weddings and festive occasions.',
    'navratri-lehenga-choli': 'Navratri special lehenga choli collection. Vibrant colors and traditional designs perfect for Garba and Dandiya nights.',
  };
  
  const description = descriptions[handle] || `Shop ${title} collection at Atsevam. Premium handcrafted ethnic wear with traditional craftsmanship.`;
  
  return [
    {title: `${title} — Atsevam | Premium Ethnic Wear`},
    {name: 'description', content: description},
    {name: 'keywords', content: `${title.toLowerCase()}, ${handle}, ethnic wear, indian wear, atsevam`},
    
    // Open Graph
    {property: 'og:title', content: `${title} — Atsevam`},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'product.group'},
    
    // Twitter
    {name: 'twitter:title', content: `${title} — Atsevam`},
    {name: 'twitter:description', content: description},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 250});

  if (!handle) throw redirect('/collections');

  // Redirect common singular categories to their plural equivalents
  if (handle === 'kurti') throw redirect('/collections/kurtis');
  if (handle === 'lehenga') throw redirect('/collections/lehengas');
  if (handle === 'co-ord') throw redirect('/collections/co-ords');
  if (handle === 'anarkalis') throw redirect('/collections/anarkali');

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
        category: getCategoryName(handle),
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
        handle: handle,
        title: handle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Browse our collection of handcrafted ethnic wear',
      },
      products: transformedProducts,
      filters,
    };
  }
  
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const transformedProducts = collection.products.nodes.map((product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;
    
    let badge: 'new' | 'sale' | 'bestseller' | 'top-rated' | undefined;
    if (product.tags?.includes('new')) badge = 'new';
    else if (product.tags?.includes('bestseller')) badge = 'bestseller';
    else if (product.tags?.includes('top-rated')) badge = 'top-rated';
    else if (compareAtPrice && compareAtPrice > price) badge = 'sale';

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
      category: getCategoryName(handle),
      badge,
      rating: undefined,
      reviewCount: undefined,
      tags: product.tags || [],
    };
  });

  const filters = parseFilters(collection.products.nodes);

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
  {value: 'recommended', label: 'Recommended'},
  {value: 'newest',      label: 'New Arrivals'},
  {value: 'price-asc',   label: 'Price: Low to High'},
  {value: 'price-desc',  label: 'Price: High to Low'},
  {value: 'top-rated',   label: 'Customer Rating'},
];

// ─── Page ─────────────────────────────────────────────────────────

export default function Collection() {
  const {collection, products: allProducts, filters} = useLoaderData<typeof loader>();

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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
    setTimeout(() => setIsUpdating(false), 300);
  }, []);

  const clearAll = useCallback(() => {
    setIsUpdating(true);
    setActiveFilters({});
    setTimeout(() => setIsUpdating(false), 300);
  }, []);

  const clearGroup = useCallback((groupId: string) => {
    setIsUpdating(true);
    setActiveFilters((prev) => {
      const next = {...prev};
      delete next[groupId];
      return next;
    });
    setTimeout(() => setIsUpdating(false), 300);
  }, []);

  // Client-side filter + sort
  const products = useMemo(() => {
    let result = [...allProducts];

    Object.entries(activeFilters).forEach(([groupId, values]) => {
      if (values.length > 0) {
        result = result.filter((p) => {
          const productTags = (p as any).tags || [];
          return values.some(filterValue => {
            return productTags.some((tag: string) => {
              const tagLower = tag.toLowerCase();
              if (groupId === 'tag') return tagLower === filterValue.toLowerCase();
              const expectedCol = `${groupId}:${filterValue}`.toLowerCase();
              const expectedScore = `${groupId}_${filterValue}`.toLowerCase();
              return tagLower === expectedCol || tagLower === expectedScore;
            });
          });
        });
      }
    });

    if (sortBy === 'newest') result = result.filter((p) => p.badge === 'new').concat(result.filter((p) => p.badge !== 'new'));
    if (sortBy === 'price-asc') result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sortBy === 'price-desc') result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sortBy === 'top-rated') result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return result;
  }, [allProducts, activeFilters, sortBy]);

  const activeCount = Object.values(activeFilters).flat().length;

  // Active filter chips for toolbar display
  const activeChips = Object.entries(activeFilters).flatMap(([groupId, values]) =>
    values.map((val) => {
      const group = filters.find((f) => f.id === groupId);
      const opt = group?.options.find((o) => o.value === val);
      return {groupId, value: val, label: opt?.label ?? val};
    })
  );

  return (
    <div className="av-collection">
      {/* Breadcrumb */}
      <nav className="av-breadcrumb container" aria-label="Breadcrumb">
        <a href="/" className="av-breadcrumb__link">Home</a>
        <span className="av-breadcrumb__sep">/</span>
        <a href="/collections" className="av-breadcrumb__link">Collections</a>
        <span className="av-breadcrumb__sep">/</span>
        <span className="av-breadcrumb__current">{collection.title}</span>
      </nav>

      {/* Collection header */}
      <div className="av-collection__header container">
        <h1 className="av-collection__title">
          {collection.title}
          <span className="av-collection__count"> - {products.length} items</span>
        </h1>
      </div>

      {/* Toolbar — filters label + active chips + sort */}
      <div className="av-collection__toolbar container">
        <div className="av-collection__toolbar-left">
          <span className="av-toolbar__filters-label">FILTERS</span>
          {activeCount > 0 && (
            <button className="av-toolbar__clear-all" onClick={clearAll}>
              CLEAR ALL
            </button>
          )}
        </div>

        {/* Active filter chips in toolbar - Myntra style */}
        {activeChips.length > 0 && (
          <div className="av-toolbar__chips">
            {activeChips.map((chip) => (
              <button
                key={`${chip.groupId}-${chip.value}`}
                className="av-toolbar__chip"
                onClick={() => toggleFilter(chip.groupId, chip.value)}
              >
                <span>{chip.label}</span>
                <Icon name="close" size={10} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        )}

        {/* Mobile filter trigger */}
        <MobileFilterTrigger
          activeCount={activeCount}
          onClick={() => setMobileFilterOpen(true)}
        />

        <div className="av-collection__toolbar-right">
          <div className="av-sort">
            <label className="av-sort__label" htmlFor="sort-select">Sort by :</label>
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
        {/* Desktop filter sidebar */}
        <FilterSidebar
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={toggleFilter}
          onClearAll={clearAll}
          onClearGroup={clearGroup}
          totalCount={products.length}
        />

        {/* Product grid */}
        <div className="av-collection__main">
          {products.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <div className={`av-product-grid${isUpdating ? ' av-product-grid--updating' : ''}`}>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 8 ? 'eager' : 'lazy'}
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
        onClearGroup={clearGroup}
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
      <div className="av-collection__empty-icon">
        <Icon name="search" size={48} strokeWidth={1} />
      </div>
      <p className="av-collection__empty-title">No products found</p>
      <p className="av-collection__empty-sub">
        Try adjusting your filters to find what you're looking for.
      </p>
      <button className="btn btn-secondary" onClick={onClear}>
        Clear All Filters
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
