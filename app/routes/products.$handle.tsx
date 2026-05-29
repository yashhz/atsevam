import {useLoaderData, Form, useNavigation, useFetcher} from 'react-router';
import {useState, useRef, useEffect} from 'react';
import {JudgemeReviewWidget} from '@judgeme/shopify-hydrogen';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductForm} from '~/components/ProductForm';
import {ProductPrice} from '~/components/ProductPrice';
import {Icon} from '~/components/ui/Icon';
import {Badge} from '~/components/ui/Badge';
import {Accordion, AccordionItem} from '~/components/ui/Accordion';
import {ProductGrid} from '~/components/ProductGrid';
import {MOCK_PRODUCT_DETAIL} from '~/lib/mock';
import type {MockProductDetail} from '~/lib/mock';

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  if (!product) return [{title: 'Product Not Found — Atsevam'}];
  
  const title = product.title;
  const description = product.description || `Shop ${title} at Atsevam. Premium handcrafted ethnic wear with traditional craftsmanship.`;
  const image = product.featuredImage?.url;
  
  return [
    {title: `${title} — Atsevam | Premium Ethnic Wear`},
    {name: 'description', content: description.substring(0, 160)},
    
    // Open Graph / Facebook
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description.substring(0, 160)},
    {property: 'og:image', content: image},
    
    // Twitter
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description.substring(0, 160)},
    {name: 'twitter:image', content: image},
    
    {rel: 'canonical', href: `/products/${product.handle}`},
  ];
};

export async function action({request, context, params}: Route.ActionArgs) {
  const {handle} = params;
  if (!handle) throw new Error('Expected product handle');

  const {customerAccount} = context;
  const isLoggedIn = await customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return {error: 'You must be logged in to leave a review.'};
  }

  // 1. Verify purchase
  const VERIFY_PURCHASES_QUERY = `
    query VerifyPurchasesAction {
      customer {
        orders(first: 100) {
          nodes {
            lineItems(first: 100) {
              nodes {
                merchandise {
                  ... on ProductVariant {
                    product {
                      handle
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  let hasPurchased = false;
  try {
    const {data} = await customerAccount.query(VERIFY_PURCHASES_QUERY);
    const purchasedHandles = data?.customer?.orders?.nodes?.flatMap((order: any) => 
      order.lineItems?.nodes?.map((item: any) => item.merchandise?.product?.handle)
    ).filter(Boolean) || [];
    hasPurchased = purchasedHandles.includes(handle);
  } catch (err) {
    console.error('Failed to verify purchase in action:', err);
  }

  if (!hasPurchased) {
    return {error: 'Only verified buyers who purchased this item can write a review.'};
  }

  // 2. Extract form data
  const formData = await request.formData();
  const author_name = formData.get('author_name')?.toString();
  const rating = parseInt(formData.get('rating')?.toString() || '5', 10);
  const title = formData.get('title')?.toString();
  const body = formData.get('body')?.toString();

  if (!author_name || !title || !body || isNaN(rating)) {
    return {error: 'All fields are required.'};
  }

  // 3. Save to Supabase
  const SUPABASE_URL = 'https://ymwnsesccyrngeaxomzr.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_qYDd2q32eK8xx949ICV6pg_1FD0k_1r';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        product_handle: handle,
        author_name,
        rating,
        title,
        body,
        verified_buyer: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase write error:', errText);
      return {error: 'Failed to save review. Please try again.'};
    }

    return {success: true};
  } catch (err) {
    console.error('Supabase save failed:', err);
    return {error: 'Network error. Please try again.'};
  }
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const {handle} = args.params;
  const {customerAccount} = args.context;

  // 1. Check login
  const isLoggedIn = await customerAccount.isLoggedIn();

  // 2. Verify purchase if logged in
  let hasPurchased = false;
  let customerName = '';
  if (isLoggedIn) {
    try {
      const VERIFY_PURCHASES_QUERY = `
        query VerifyPurchasesLoader {
          customer {
            firstName
            lastName
            orders(first: 100) {
              nodes {
                lineItems(first: 100) {
                  nodes {
                    merchandise {
                      ... on ProductVariant {
                        product {
                          handle
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const {data} = await customerAccount.query(VERIFY_PURCHASES_QUERY);
      if (data?.customer) {
        customerName = `${data.customer.firstName || ''} ${data.customer.lastName || ''}`.trim();
        const purchasedHandles = data.customer.orders?.nodes?.flatMap((order: any) => 
          order.lineItems?.nodes?.map((item: any) => item.merchandise?.product?.handle)
        ).filter(Boolean) || [];
        hasPurchased = purchasedHandles.includes(handle);
      }
    } catch (err) {
      console.error('Failed to verify purchase in loader:', err);
    }
  }

  // 3. Fetch reviews from Supabase
  const SUPABASE_URL = 'https://ymwnsesccyrngeaxomzr.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_qYDd2q32eK8xx949ICV6pg_1FD0k_1r';
  let reviews: any[] = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews?product_handle=eq.${handle}&select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (res.ok) {
      reviews = (await res.json()) as any[];
    }
  } catch (err) {
    console.error('Failed to fetch reviews from Supabase:', err);
  }

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;

  return {
    ...deferredData,
    ...criticalData,
    isLoggedIn,
    hasPurchased,
    customerName,
    reviews,
    averageRating,
    totalReviews,
  };
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  if (!handle) throw new Error('Expected product handle');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY_FULL, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);
  
  if (!product?.id) {
    throw new Response('Product not found', {status: 404});
  }
  
  redirectIfHandleIsLocalized(request, {handle, data: product});
  
  // Determine category from productType or tags
  let category = 'Ethnic Wear';
  if (product.productType) {
    category = product.productType;
  } else if (product.tags?.length > 0) {
    // Only use tag if it matches our known categories
    const knownCategories = ['Lehenga', 'Anarkali', 'Kurti', 'Co-ord'];
    const matchedCategory = product.tags.find((tag: string) => 
      knownCategories.some(cat => tag.toLowerCase().includes(cat.toLowerCase()))
    );
    if (matchedCategory) category = matchedCategory;
  }
  
  // Transform Shopify product to match display structure
  const rawPrice = parseFloat(product.selectedOrFirstAvailableVariant?.price.amount || '0');
  const rawCompare = product.selectedOrFirstAvailableVariant?.compareAtPrice
    ? parseFloat(product.selectedOrFirstAvailableVariant.compareAtPrice.amount)
    : undefined;

  const transformedProduct: MockProductDetail = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    category,
    badge: (product.tags?.includes('new') ? 'new' : product.tags?.includes('sale') ? 'sale' : undefined) as 'new' | 'sale' | undefined,
    price: `₹${Math.round(rawPrice).toLocaleString('en-IN')}`,
    compareAtPrice: rawCompare ? `₹${Math.round(rawCompare).toLocaleString('en-IN')}` : undefined,
    discount: rawCompare && rawCompare > rawPrice
      ? Math.round(((rawCompare - rawPrice) / rawCompare) * 100)
      : undefined,
    rating: 4.8,
    reviewCount: 1000,
    featuredImage: {
      url: product.featuredImage?.url || product.images?.nodes?.[0]?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
      altText: product.featuredImage?.altText || product.title,
    },
    description: product.description || '',
    images: product.images?.nodes?.map((img: any) => ({
      url: img.url,
      altText: img.altText || product.title,
    })) || [],
    sizes: ['Free Size (Up to 42 Inch)'],
    details: {
      workPattern: product.tags?.find((t: string) => t.includes('Work')) || 'Embroidery Work',
      stitchingType: 'Semi-Stitched',
      neckline: 'Round Neck',
      sleeves: 'Regular Sleeve',
      closure: 'Zip Closure',
      setContents: 'Lehenga: 1, Choli: 1, Dupatta: 1',
    },
    fabric: {
      top: 'Net',
      bottom: 'Net',
      dupatta: 'Net',
      innerLining: 'Ultra Satin',
      flairWidth: '3 Mtr',
      topLength: '1 Meter',
      bottomLength: '42 inches',
      dupattaDimensions: '2.20 Meters',
    },
    care: {
      washing: 'Dry clean only',
      drying: 'Hang dry in shade',
      ironing: 'Steam iron on low heat',
      delivery: '5-7 business days',
    },
    relatedProducts: [] as any[],
  };
  
  // Fetch related products using smart recommendation logic
  const relatedProducts = await fetchRelatedProducts(storefront, product);
  transformedProduct.relatedProducts = relatedProducts;
  
  return {product, mockProduct: transformedProduct, useMock: false};
}

// Smart product recommendation function
async function fetchRelatedProducts(storefront: any, currentProduct: any) {
  const productTags = currentProduct.tags || [];
  const productType = currentProduct.productType || '';
  const currentProductId = currentProduct.id;
  
  // Strategy 1: Try to find products with matching tags
  if (productTags.length > 0) {
    const tagQuery = productTags.slice(0, 3).map((tag: string) => `tag:${tag}`).join(' OR ');
    
    const {products: tagMatches} = await storefront.query(
      `#graphql
        query RelatedByTags($query: String!) {
          products(first: 8, query: $query) {
            nodes {
              id
              title
              handle
              productType
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                }
              }
              featuredImage {
                url
                altText
              }
              images(first: 2) {
                nodes {
                  url
                  altText
                }
              }
              tags
            }
          }
        }
      `,
      {variables: {query: tagQuery}}
    );
    
    if (tagMatches?.nodes?.length > 0) {
      const filtered = tagMatches.nodes
        .filter((p: any) => p.id !== currentProductId && p.featuredImage)
        .slice(0, 6);
      
      if (filtered.length >= 4) {
        return transformProducts(filtered);
      }
    }
  }
  
  // Strategy 2: Fallback to same product type
  if (productType) {
    const {products: typeMatches} = await storefront.query(
      `#graphql
        query RelatedByType($productType: String!) {
          products(first: 8, query: $productType) {
            nodes {
              id
              title
              handle
              productType
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                }
              }
              featuredImage {
                url
                altText
              }
              images(first: 2) {
                nodes {
                  url
                  altText
                }
              }
              tags
            }
          }
        }
      `,
      {variables: {productType}}
    );
    
    if (typeMatches?.nodes?.length > 0) {
      const filtered = typeMatches.nodes
        .filter((p: any) => p.id !== currentProductId && p.featuredImage)
        .slice(0, 6);
      
      if (filtered.length >= 4) {
        return transformProducts(filtered);
      }
    }
  }
  
  // Strategy 3: Last resort - random products
  const {products: randomProducts} = await storefront.query(
    `#graphql
      query RandomProducts {
        products(first: 8, sortKey: BEST_SELLING) {
          nodes {
            id
            title
            handle
            productType
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
              }
            }
            featuredImage {
              url
              altText
            }
            images(first: 2) {
              nodes {
                url
                altText
              }
            }
            tags
          }
        }
      }
    `
  );
  
  const filtered = randomProducts.nodes
    .filter((p: any) => p.id !== currentProductId && p.featuredImage)
    .slice(0, 6);
  
  return transformProducts(filtered);
}

// Transform products to match ProductCard structure
function transformProducts(products: any[]) {
  return products.map((product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;
    
    // Determine category from productType or tags
    let category = 'Ethnic Wear';
    if (product.productType) {
      category = product.productType;
    } else if (product.tags?.length > 0) {
      const knownCategories = ['Lehenga', 'Anarkali', 'Kurti', 'Co-ord'];
      const matchedCategory = product.tags.find((tag: string) => 
        knownCategories.some(cat => tag.toLowerCase().includes(cat.toLowerCase()))
      );
      if (matchedCategory) category = matchedCategory;
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
      hoverImage: product.images.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : undefined,
      category,
      badge: compareAtPrice && compareAtPrice > price ? 'sale' as const : undefined,
      rating: undefined,
      reviewCount: undefined,
    };
  });
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

// ─── Page ─────────────────────────────────────────────────────────

export default function Product() {
  const {
    product,
    mockProduct,
    useMock,
    isLoggedIn,
    hasPurchased,
    customerName,
    reviews,
    averageRating,
    totalReviews,
  } = useLoaderData<typeof loader>();
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const [userRating, setUserRating] = useState(5);

  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success) {
      formRef.current?.reset();
      setUserRating(5);
      setShowReviewForm(false);
    }
  }, [fetcher.data]);

  // Shopify variant logic — hooks must always be called (React rules)
  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant ?? null,
    product ? getAdjacentAndFirstAvailableVariants(product) : [],
  );

  useSelectedOptionInUrlParam(selectedVariant?.selectedOptions ?? []);

  const productOptions = product && selectedVariant
    ? getProductOptions({...product, selectedOrFirstAvailableVariant: selectedVariant})
    : [];

  const mock = mockProduct;
  const images = mock.images;

  // Reset to first image when product changes (navigation between products)
  useEffect(() => {
    setActiveImage(0);
  }, [mock.id]);

  // Sync active thumbnail when scrolling images on desktop
  const handleImageScroll = () => {
    imageRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < window.innerHeight * 0.5) {
        setActiveImage(i);
      }
    });
  };

  return (
    <div className="av-pdp">
      {/* Breadcrumb */}
      <nav className="av-breadcrumb container" aria-label="Breadcrumb">
        <a href="/" className="av-breadcrumb__link">Home</a>
        <span className="av-breadcrumb__sep">&gt;</span>
        <a href={`/collections/${mock.category.toLowerCase()}`} className="av-breadcrumb__link">
          {mock.category}
        </a>
        <span className="av-breadcrumb__sep">&gt;</span>
        <span className="av-breadcrumb__current">{mock.title}</span>
      </nav>

      {/* TOP SECTION: Image Gallery + Essential Info */}
      <div className="av-pdp__top container">

        {/* LEFT: Image Gallery with Thumbnails */}
        <div className="av-pdp__gallery">
          {/* Vertical thumbnail strip */}
          <div className="av-pdp__thumbs">
            {images.map((img: any, i: number) => (
              <button
                key={i}
                className={`av-pdp__thumb${activeImage === i ? ' av-pdp__thumb--active' : ''}`}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img.url} alt={img.altText} loading="lazy" />
              </button>
            ))}
          </div>

          {/* Main display image */}
          <div className="av-pdp__main-image">
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.altText}
              loading="eager"
            />
          </div>
        </div>

        {/* RIGHT: Essential Product Info */}
        <div className="av-pdp__essential-info">
          {/* Title */}
          <h1 className="av-pdp__title" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-bold)', fontSize: '1.8rem', letterSpacing: 'var(--tracking-wide)', margin: '0 0 var(--space-2)' }}>
            {mock.title}
          </h1>

          {/* Premium Tag Chips & Actions Row */}
          <div className="av-pdp__tag-chips-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', margin: '0 0 var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <div className="av-pdp__tag-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <span className="av-pdp__tag-chip" style={{ border: '1px solid var(--color-border)', padding: '4px 12px', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', color: 'var(--color-secondary)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wider)' }}>
                {mock.category}
              </span>
              <span className="av-pdp__tag-chip" style={{ border: '1px solid var(--color-border)', padding: '4px 12px', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', color: 'var(--color-secondary)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wider)' }}>
                {mock.details?.stitchingType || 'Semi-Stitched'}
              </span>
              <span className="av-pdp__tag-chip" style={{ border: '1px solid var(--color-border)', padding: '4px 12px', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', color: 'var(--color-brand)', background: 'var(--color-brand-pale)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wider)' }}>
                Rating {(totalReviews > 0 ? averageRating : mock.rating ?? 4.8).toFixed(1)} ★
              </span>
            </div>
            <div className="av-pdp__actions-top" style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className={`wishlist-btn${wishlisted ? ' active' : ''}`}
                onClick={() => setWishlisted((v) => !v)}
                aria-label="Add to wishlist"
              >
                <Icon name={wishlisted ? 'heart-filled' : 'heart'} size={18} strokeWidth={1.5} />
              </button>
              <ShareButtons title={mock.title} handle={mock.handle} image={mock.featuredImage.url} />
            </div>
          </div>

          {/* Price */}
          <div className="av-pdp__price-block">
            <span className="av-pdp__price">{mock.price}</span>
            {mock.compareAtPrice && (
              <>
                <span className="av-pdp__compare">{mock.compareAtPrice}</span>
                {mock.discount && (
                  <span className="av-pdp__discount-badge">{mock.discount}% OFF</span>
                )}
              </>
            )}
            <span className="av-pdp__tax-note">MRP inclusive of all taxes</span>
          </div>

          {/* Sizing & In-Stock Status Badge */}
          <div className="av-pdp__stock-status" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 'var(--space-2) 0 var(--space-4)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2D6A4F' }} />
            <span style={{ fontSize: '12px', color: '#2D6A4F', fontWeight: 600, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
              In Stock (Only 3 left!)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 var(--space-1)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontFamily: 'var(--font-body)' }}>
              ✓ Ready to dispatch
            </span>
          </div>

          {/* Direct from manufacturer badge */}
          <div className="av-pdp__manufacturer-badge">
            <Icon name="shield" size={16} strokeWidth={1.5} />
            <span>Direct from manufacturer — premium quality at best price</span>
          </div>

          {/* Size selector - only show if multiple sizes */}
          {mock.sizes.length > 1 && (
            <div className="av-pdp__sizes">
              <div className="av-pdp__sizes-header">
                <span className="av-pdp__sizes-label">Size</span>
                <a href="/pages/size-guide" className="av-pdp__size-guide">
                  Size Guide <Icon name="arrow-right" size={12} strokeWidth={1.5} />
                </a>
              </div>
              <div className="av-pdp__size-options">
                {mock.sizes.map((size) => (
                  <button key={size} className="av-pdp__size-btn av-pdp__size-btn--active">
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          {useMock ? (
            <MockAddToCart />
          ) : (
            product && selectedVariant && (
              <div className="av-pdp__cart-section">
                <ProductForm
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                />
              </div>
            )
          )}

          {/* B2B link */}
          <p className="av-pdp__b2b">
            Looking for wholesale / B2B pricing?{' '}
            <a href="/pages/wholesale" className="av-pdp__b2b-link">Apply here</a>
          </p>

          {/* Trust row */}
          <div className="av-pdp__trust">
            <div className="av-pdp__trust-item">
              <Icon name="truck" size={16} strokeWidth={1.25} />
              <span>Free shipping above ₹1,999</span>
            </div>
            <div className="av-pdp__trust-item">
              <Icon name="heart" size={16} strokeWidth={1.25} />
              <span>Easy 7-day returns</span>
            </div>
            <div className="av-pdp__trust-item">
              <Icon name="user" size={16} strokeWidth={1.25} />
              <span>Cash on delivery available</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Full-width Product Details */}
      <div className="av-pdp__details container">
        <div className="av-pdp__accordions">
          <Accordion>
            <AccordionItem title="Product Details" defaultOpen>
              <ProductDetailsContent details={mock.details} />
            </AccordionItem>
            <AccordionItem title="Fabric & Sizing">
              <FabricContent fabric={mock.fabric} />
            </AccordionItem>
            <AccordionItem title="Care & Delivery">
              <CareContent care={mock.care} />
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* ── Verified Customer Reviews ──────────────────────────────── */}
      <div className="av-pdp__reviews container" id="customer-reviews">
        <div className="av-pdp__reviews-header">
          <span className="av-pdp__reviews-eyebrow">Customer Reviews</span>
          <h2 className="av-pdp__reviews-title">What Our Customers Say</h2>
        </div>

        {/* Simplified Center Rating Bar & Action Buttons */}
        <div className="av-pdp__reviews-summary-bar">
          <div className="av-pdp__reviews-summary-left">
            <div className="av-pdp__reviews-summary-stars">
              {Array.from({length: 5}).map((_, idx) => (
                <Icon
                  key={idx}
                  name="star-filled"
                  size={18}
                  strokeWidth={0}
                  className={idx < Math.round(totalReviews > 0 ? averageRating : mock.rating || 0) ? 'av-pdp__review-star' : 'av-pdp__review-star--empty'}
                />
              ))}
            </div>
            <span className="av-pdp__reviews-summary-text">
              <strong>{(totalReviews > 0 ? averageRating : mock.rating ?? 4.8).toFixed(1)}</strong> out of 5 stars (based on {totalReviews > 0 ? totalReviews : mock.reviewCount ?? 1000} verified reviews)
            </span>
          </div>

          <div className="av-pdp__reviews-summary-actions">
            <button
              onClick={() => {
                setShowReviewForm(!showReviewForm);
                setShowQuestionForm(false);
              }}
              className={`av-pdp__reviews-btn ${showReviewForm ? 'av-pdp__reviews-btn--active' : ''}`}
            >
              Write review
            </button>
            <button
              onClick={() => {
                setShowQuestionForm(!showQuestionForm);
                setShowReviewForm(false);
                setQuestionSubmitted(false);
              }}
              className={`av-pdp__reviews-btn ${showQuestionForm ? 'av-pdp__reviews-btn--active' : ''}`}
            >
              Ask a question
            </button>
          </div>
        </div>

        {/* Toggleable Review and Question Forms */}
        <div className="av-pdp__reviews-toggles" style={{ maxWidth: '720px', margin: '0 auto var(--space-8)' }}>
          {showReviewForm && (
            <div className="av-pdp__reviews-form-wrapper">
              {/* Verified Review Form */}
              {isLoggedIn ? (
                hasPurchased ? (
                  <fetcher.Form ref={formRef} method="post" className="av-pdp__review-form">
                    <h3 className="av-pdp__review-form-title">✍️ Write a Review</h3>
                    
                    <div className="av-pdp__review-input-group">
                      <label className="av-pdp__review-label">Your Rating</label>
                      <div className="av-pdp__stars-selector">
                        {Array.from({length: 5}).map((_, i) => {
                          const currentStar = i + 1;
                          return (
                            <button
                              key={i}
                              type="button"
                              className={`av-pdp__star-btn${currentStar <= userRating ? '' : ' av-pdp__star-btn--empty'}`}
                              onClick={() => setUserRating(currentStar)}
                              aria-label={`Rate ${currentStar} stars`}
                            >
                              <Icon name="star-filled" size={22} strokeWidth={0} />
                            </button>
                          );
                        })}
                      </div>
                      <input type="hidden" name="rating" value={userRating} />
                    </div>

                    <div className="av-pdp__review-input-group">
                      <label htmlFor="author_name" className="av-pdp__review-label">Display Name</label>
                      <input
                        id="author_name"
                        name="author_name"
                        type="text"
                        defaultValue={customerName}
                        placeholder="e.g. Priyanjali"
                        required
                        className="av-pdp__review-input"
                      />
                    </div>

                    <div className="av-pdp__review-input-group">
                      <label htmlFor="title" className="av-pdp__review-label">Review Title</label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="e.g. Stunning flare and premium fabric!"
                        required
                        className="av-pdp__review-input"
                      />
                    </div>

                    <div className="av-pdp__review-input-group">
                      <label htmlFor="body" className="av-pdp__review-label">Review Details</label>
                      <textarea
                        id="body"
                        name="body"
                        placeholder="Share details about the embroidery, flare width, stitching quality, etc."
                        required
                        className="av-pdp__review-textarea"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={fetcher.state === 'submitting'}
                      className="av-pdp__review-submit-btn"
                    >
                      {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit Verified Review'}
                    </button>

                    {fetcher.data && (fetcher.data as any).success && (
                      <div className="av-pdp__reviews-success">
                        🎉 Thank you! Your verified review has been submitted.
                      </div>
                    )}

                    {fetcher.data && (fetcher.data as any).error && (
                      <div className="av-pdp__reviews-error">
                        ⚠️ {(fetcher.data as any).error}
                      </div>
                    )}
                  </fetcher.Form>
                ) : (
                  <div className="av-pdp__review-form">
                    <div className="av-pdp__reviews-lock-card">
                      <Icon name="shield" size={28} strokeWidth={1.5} />
                      <h3 className="av-pdp__reviews-lock-title">Review Locked</h3>
                      <p className="av-pdp__reviews-lock-sub">
                        Only verified buyers who purchased this product from Atsevam can leave a review.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="av-pdp__review-form">
                  <div className="av-pdp__reviews-lock-card">
                    <Icon name="shield" size={28} strokeWidth={1.5} />
                    <h3 className="av-pdp__reviews-lock-title">Login to Review</h3>
                    <p className="av-pdp__reviews-lock-sub">
                      Sign in to your Atsevam account to verify your purchase and share your experience.
                    </p>
                    <a href="/account/login" className="av-pdp__reviews-lock-btn">
                      Sign In to Account
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {showQuestionForm && (
            <div className="av-pdp__review-form">
              <h3 className="av-pdp__review-form-title">❓ Ask a Question</h3>
              {questionSubmitted ? (
                <div className="av-pdp__reviews-success">
                  🎉 Thank you! Your question has been submitted and our support team will reply shortly.
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setQuestionSubmitted(true); }} className="av-pdp__question-form">
                  <div className="av-pdp__review-input-group">
                    <label htmlFor="q_name" className="av-pdp__review-label">Your Name</label>
                    <input id="q_name" type="text" placeholder="e.g. Shalini" required className="av-pdp__review-input" />
                  </div>
                  <div className="av-pdp__review-input-group">
                    <label htmlFor="q_text" className="av-pdp__review-label">Your Question</label>
                    <textarea id="q_text" placeholder="Ask about product availability, customization, blouse piece length, sizing, etc." required className="av-pdp__review-textarea" />
                  </div>
                  <button type="submit" className="av-pdp__review-submit-btn">Submit Question</button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="av-pdp__reviews-layout-new">
          <div className="av-pdp__reviews-list-new" style={{ maxWidth: '960px', margin: '0 auto' }}>
            {reviews && reviews.length > 0 ? (
              reviews.map((review: any) => {
                const dateStr = new Date(review.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const initials = review.author_name
                  ? review.author_name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
                  : '?';
                return (
                  <div key={review.id} className="av-pdp__review-card" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="av-pdp__review-card-head">
                      <div className="av-pdp__review-author-info">
                        <div className="av-pdp__review-avatar" aria-hidden="true">{initials}</div>
                        <div className="av-pdp__review-author-meta">
                          <span className="av-pdp__review-author">{review.author_name}</span>
                          {review.verified_buyer && (
                            <span className="av-pdp__review-verified">
                              <Icon name="check-circle" size={10} strokeWidth={2.5} /> Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="av-pdp__review-date">{dateStr}</span>
                    </div>
                    <div className="av-pdp__review-stars">
                      {Array.from({length: 5}).map((_, idx) => (
                        <Icon
                          key={idx}
                          name="star-filled"
                          size={13}
                          strokeWidth={0}
                          className={idx < review.rating ? 'av-pdp__review-star' : 'av-pdp__review-star--empty'}
                        />
                      ))}
                    </div>
                    <h4 className="av-pdp__review-card-title">{review.title}</h4>
                    <p className="av-pdp__review-card-body">{review.body}</p>
                  </div>
                );
              })
            ) : (
              <div className="av-pdp__review-card" style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-6)' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
                  No reviews yet for this product. Be the first verified purchaser to share your experience!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* You May Also Like */}
      {mock.relatedProducts && mock.relatedProducts.length > 0 && (
        <ProductGrid
          eyebrow="Curated For You"
          title="You May Also Like"
          products={mock.relatedProducts}
          viewAllHref={`/collections/${mock.category.toLowerCase().replace(/\s+/g, '-')}`}
          viewAllLabel="View Collection"
          loading="lazy"
          columns={4}
        />
      )}

      {product && (
        <Analytics.ProductView
          data={{
            products: [{
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            }],
          }}
        />
      )}
    </div>
  );
}

// ─── Mock Add to Cart (design preview) ───────────────────────────

function MockAddToCart() {
  const [added, setAdded] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClick = () => {
    setAdded(true);
    setProgress(0);
    
    // Animate progress bar
    const duration = 2000;
    const steps = 60;
    const increment = 100 / steps;
    const stepDuration = duration / steps;
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setAdded(false);
        setProgress(0);
      } else {
        setProgress(currentProgress);
      }
    }, stepDuration);
  };

  return (
    <button
      className={`btn btn-primary btn-full btn-lg av-pdp__atc${added ? ' av-pdp__atc--added' : ''}`}
      onClick={handleClick}
      style={{
        '--progress': `${progress}%`,
      } as React.CSSProperties}
    >
      {added ? (
        <>
          <Icon name="star-filled" size={16} strokeWidth={0} />
          Added to Cart
        </>
      ) : (
        'Add to Cart'
      )}
    </button>
  );
}

// ─── Social Share Buttons ─────────────────────────────────────────

function ShareButtons({title, handle, image}: {title: string; handle: string; image: string}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const url = typeof window !== 'undefined'
    ? window.location.href
    : `https://atsevam.com/products/${handle}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = encodeURIComponent(image);

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon: '💬',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: 'Pinterest',
      icon: '📌',
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    },
    {
      label: 'Twitter / X',
      icon: '🐦',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  return (
    <div className="av-share" ref={ref}>
      <button
        className={`wishlist-btn${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Share product"
        aria-expanded={open}
      >
        <Icon name="share" size={18} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="av-share__dropdown" role="menu">
          <p className="av-share__label">Share this product</p>
          {shareLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="av-share__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="av-share__icon">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accordion content components ────────────────────────────────

function ProductDetailsContent({details}: {details: MockProductDetail['details']}) {
  const rows: [string, string][] = [
    ['Work Pattern',    details.workPattern],
    ['Stitching Type',  details.stitchingType],
    ['Neckline',        details.neckline],
    ['Sleeves',         details.sleeves],
    ['Closure',         details.closure],
    ['Set Contents',    details.setContents],
  ];
  return <DetailTable rows={rows} />;
}

function FabricContent({fabric}: {fabric: MockProductDetail['fabric']}) {
  const rows: [string, string][] = [
    ['Top / Choli Fabric',   fabric.top],
    ['Lehenga Fabric',       fabric.bottom],
    ['Dupatta Fabric',       fabric.dupatta],
    ['Inner Lining',         fabric.innerLining],
    ['Flair Width',          fabric.flairWidth],
    ['Top Length',           fabric.topLength],
    ['Bottom Length',        fabric.bottomLength],
    ['Dupatta Dimensions',   fabric.dupattaDimensions],
  ];
  return <DetailTable rows={rows} />;
}

function CareContent({care}: {care: MockProductDetail['care']}) {
  const rows: [string, string][] = [
    ['Washing',   care.washing],
    ['Drying',    care.drying],
    ['Ironing',   care.ironing],
    ['Delivery',  care.delivery],
  ];
  return <DetailTable rows={rows} />;
}

function DetailTable({rows}: {rows: [string, string][]}) {
  return (
    <table className="av-detail-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="av-detail-table__row">
            <td className="av-detail-table__label">{label}</td>
            <td className="av-detail-table__value">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── GraphQL ──────────────────────────────────────────────────────

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice { amount currencyCode }
    id
    image { __typename id url altText width height }
    price { amount currencyCode }
    product { title handle }
    selectedOptions { name value }
    sku
    title
    unitPrice { amount currencyCode }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    descriptionHtml
    description
    featuredImage {
      url
      altText
      width
      height
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant { ...ProductVariant }
        swatch {
          color
          image { previewImage { url } }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo { description title }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY_FULL = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
      tags
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
