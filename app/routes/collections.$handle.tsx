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
  {title: `Avestam | ${data?.collection?.title ?? 'Collection'}`},
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
        : null;

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: `₹${Math.round(price).toLocaleString('en-IN')}`,
        compareAtPrice: compareAtPrice ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}` : null,
        featuredImage: {
          url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
          altText: product.featuredImage?.altText || product.title,
        },
        hoverImage: product.images?.nodes[1] ? {
          url: product.images.nodes[1].url,
          altText: product.images.nodes[1].altText || product.title,
        } : null,
        category: product.tags?.[0] || 'Lehenga Choli',
        badge: compareAtPrice && compareAtPrice > price ? 'sale' as const : null,
        rating: null,
        reviewCount: null,
      };
    });

    // Build filters from all products
    const allTags = products.nodes.flatMap((p: any) => p.tags || []);
    const uniqueTags = [...new Set(allTags)] as string[];
    
    const filters = [
      {
        id: 'category',
        label: 'Category',
        options: uniqueTags
          .filter((tag: string) => ['Lehenga Choli', 'Anarkali', 'Kurti', 'Co-ord'].some(cat => tag.includes(cat)))
          .map((tag: string) => ({
            value: tag.toLowerCase().replace(/\s+/g, '-'),
            label: tag,
            count: products.nodes.filter((p: any) => p.tags?.includes(tag)).length,
          })),
      },
      {
        id: 'color',
        label: 'Color',
        options: uniqueTags
          .filter((tag: string) => ['Red', 'Green', 'Blue', 'Pink', 'Purple', 'Black', 'White', 'Yellow', 'Orange', 'Lavender', 'Dusty', 'Sky'].some(color => tag.includes(color)))
          .map((tag: string) => ({
            value: tag.toLowerCase().replace(/\s+/g, '-'),
            label: tag,
            count: products.nodes.filter((p: any) => p.tags?.includes(tag)).length,
          })),
      },
    ].filter(f => f.options.length > 0);

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
      : null;

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: `₹${Math.round(price).toLocaleString('en-IN')}`,
      compareAtPrice: compareAtPrice ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}` : null,
      featuredImage: {
        url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
        altText: product.featuredImage?.altText || product.title,
      },
      hoverImage: product.images?.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : null,
      category: product.tags?.[0] || 'Lehenga Choli',
      badge: (compareAtPrice && compareAtPrice > price ? 'sale' : null) as 'sale' | 'new' | 'bestseller' | 'top-rated' | null,
      rating: null,
      reviewCount: null,
    };
  });

  // Extract unique filters from products
  const allTags = collection.products.nodes.flatMap((p: any) => p.tags || []);
  const uniqueTags = [...new Set(allTags)] as string[];
  
  console.log('DEBUG: All unique tags found:', uniqueTags);
  console.log('DEBUG: Total products:', collection.products.nodes.length);
  
  // Build dynamic filters - more flexible matching
  const categoryKeywords = ['Lehenga', 'Anarkali', 'Kurti', 'Co-ord', 'Choli', 'Saree', 'Gown'];
  const colorKeywords = ['Red', 'Green', 'Blue', 'Pink', 'Purple', 'Black', 'White', 'Yellow', 'Orange', 'Lavender', 'Dusty', 'Sky', 'Maroon', 'Navy', 'Grey', 'Brown', 'Beige', 'Gold', 'Silver', 'Cream', 'Peach', 'Mint', 'Teal', 'Coral'];
  
  const filters = [
    {
      id: 'category',
      label: 'Category',
      options: uniqueTags
        .filter((tag: string) => categoryKeywords.some(cat => tag.toLowerCase().includes(cat.toLowerCase())))
        .map((tag: string) => ({
          value: tag.toLowerCase().replace(/\s+/g, '-'),
          label: tag,
          count: collection.products.nodes.filter((p: any) => p.tags?.includes(tag)).length,
        })),
    },
    {
      id: 'color',
      label: 'Color',
      options: uniqueTags
        .filter((tag: string) => colorKeywords.some(color => tag.toLowerCase().includes(color.toLowerCase())))
        .map((tag: string) => ({
          value: tag.toLowerCase().replace(/\s+/g, '-'),
          label: tag,
          count: collection.products.nodes.filter((p: any) => p.tags?.includes(tag)).length,
        })),
    },
    {
      id: 'work',
      label: 'Work Type',
      options: uniqueTags
        .filter((tag: string) => tag.toLowerCase().includes('work') || tag.toLowerCase().includes('embroid'))
        .map((tag: string) => ({
          value: tag.toLowerCase().replace(/\s+/g, '-'),
          label: tag,
          count: collection.products.nodes.filter((p: any) => p.tags?.includes(tag)).length,
        })),
    },
  ].filter(f => f.options.length > 0);
  
  console.log('DEBUG: Generated filters:', filters);

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

  // Filter state
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const toggleFilter = useCallback((groupId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {...prev, [groupId]: next};
    });
  }, []);

  const clearAll = useCallback(() => setActiveFilters({}), []);

  // Client-side filter + sort
  const products = useMemo(() => {
    let result = [...allProducts];

    // Apply filters
    Object.entries(activeFilters).forEach(([groupId, values]) => {
      if (values.length > 0) {
        result = result.filter((p) => {
          if (groupId === 'category') {
            return values.some(v => p.category.toLowerCase().replace(/\s+/g, '-') === v);
          }
          if (groupId === 'color') {
            return values.some(v => p.category.toLowerCase().includes(v.replace(/-/g, ' ')));
          }
          return true;
        });
      }
    });

    // Sort
    if (sortBy === 'newest')     result = result.filter((p) => p.badge === 'new' as any).concat(result.filter((p) => p.badge !== 'new'));
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
            <div className={`av-collection__grid av-collection__grid--${layout}`}>
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
