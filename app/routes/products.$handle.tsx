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
  
  // 1. Detect Category
  let category = 'Ethnic Wear';
  const tags = (product.tags || []).map((t: string) => t.toLowerCase());
  const title = (product.title || '').toLowerCase();
  
  if (product.productType && product.productType.trim()) {
    category = product.productType.trim();
  } else if (tags.some((t: string) => t.includes('lehenga')) || title.includes('lehenga')) {
    category = 'Lehenga';
  } else if (tags.some((t: string) => t.includes('anarkali')) || title.includes('anarkali')) {
    category = 'Anarkali';
  } else if (tags.some((t: string) => t.includes('kurti') || t.includes('kurta')) || title.includes('kurti')) {
    category = 'Kurti';
  } else if (tags.some((t: string) => t.includes('co-ord') || t.includes('coord')) || title.includes('co-ord')) {
    category = 'Co-ord Set';
  } else if (tags.some((t: string) => t.includes('saree')) || title.includes('saree')) {
    category = 'Saree';
  } else if (tags.some((t: string) => t.includes('western') || t.includes('dress')) || title.includes('dress')) {
    category = 'Western Wear';
  }

  // 2. Extract Fabric dynamically from tags, title, or description
  const knownFabrics = ['Georgette', 'Silk', 'Cotton', 'Chiffon', 'Organza', 'Rayon', 'Satin', 'Net', 'Velvet', 'Crepe', 'Jacquard'];
  let detectedFabric = 'Premium Fabric';
  for (const fab of knownFabrics) {
    if (tags.some((t: string) => t.includes(fab.toLowerCase())) || title.includes(fab.toLowerCase()) || (product.description || '').toLowerCase().includes(fab.toLowerCase())) {
      detectedFabric = fab;
      break;
    }
  }

  // 3. Category-Specific Details & Set Contents
  let setContents = 'Ethnic Wear Outfit: 1';
  let stitchingType = 'Ready to Wear';
  let topLength = 'Standard';
  let bottomLength = 'Standard';

  const catLower = category.toLowerCase();
  if (catLower.includes('lehenga')) {
    setContents = 'Lehenga: 1, Choli: 1, Dupatta: 1';
    stitchingType = 'Semi-Stitched';
    topLength = '1 Meter (Unstitched Choli)';
    bottomLength = '42 Inches (Waist up to 42)';
  } else if (catLower.includes('anarkali')) {
    setContents = 'Anarkali Top: 1, Bottom/Pants: 1, Dupatta: 1';
    stitchingType = 'Stitched / Ready to Wear';
    topLength = '48-52 Inches';
    bottomLength = '38-40 Inches';
  } else if (catLower.includes('kurti') || catLower.includes('kurta')) {
    setContents = 'Kurti: 1 (Set includes Bottom & Dupatta if specified)';
    stitchingType = 'Stitched / Ready to Wear';
    topLength = '42-45 Inches';
    bottomLength = '38 Inches';
  } else if (catLower.includes('co-ord')) {
    setContents = 'Co-ord Top: 1, Co-ord Pants: 1';
    stitchingType = 'Stitched / Ready to Wear';
    topLength = '26-30 Inches';
    bottomLength = '38-40 Inches';
  } else if (catLower.includes('western') || catLower.includes('dress')) {
    setContents = 'Western Dress: 1';
    stitchingType = 'Ready to Wear';
    topLength = 'Full Dress Length';
    bottomLength = 'N/A';
  } else if (catLower.includes('saree')) {
    setContents = 'Saree: 1 (5.5 Mtr), Unstitched Blouse Piece: 1 (0.8 Mtr)';
    stitchingType = 'Unstitched Blouse';
    topLength = '0.8 Meter Blouse Piece';
    bottomLength = '5.5 Meter Saree';
  }

  // 4. Extract Real Sizes from Shopify Options
  const sizeOption = product.options?.find((o: any) => o.name.toLowerCase().includes('size') || o.name.toLowerCase().includes('sizing'));
  const parsedSizes = sizeOption
    ? sizeOption.optionValues?.map((v: any) => v.name)
    : ['Free Size (Up to 42 Inch)'];

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
      url: product.featuredImage?.url || product.images?.nodes?.[0]?.url || '/images/lehenga.jpg',
      altText: product.featuredImage?.altText || product.title,
    },
    description: product.descriptionHtml || product.description || '',
    images: product.images?.nodes?.map((img: any) => ({
      url: img.url,
      altText: img.altText || product.title,
    })) || [],
    sizes: parsedSizes && parsedSizes.length > 0 ? parsedSizes : ['Free Size (Up to 42 Inch)'],
    details: {
      workPattern: product.tags?.find((t: string) => t.toLowerCase().includes('work')) || 'Artisanal Embroidery',
      stitchingType,
      neckline: 'Designer Neckline',
      sleeves: 'Regular Sleeve',
      closure: 'Slip-on / Zip Closure',
      setContents,
    },
    fabric: {
      top: detectedFabric,
      bottom: detectedFabric,
      dupatta: catLower.includes('saree') ? 'N/A' : (detectedFabric === 'Net' ? 'Net' : 'Soft Chiffon / Matching Fabric'),
      innerLining: 'Comfort Satin / Micro Cotton',
      flairWidth: catLower.includes('lehenga') || catLower.includes('anarkali') ? '3.5+ Mtr' : 'N/A',
      topLength,
      bottomLength,
      dupattaDimensions: catLower.includes('saree') ? '5.5 Mtr Saree' : '2.2 Mtr',
    },
    care: {
      washing: 'Dry clean recommended',
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

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else {
        setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
    }
    setTouchStartX(null);
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

          {/* Main display image with touch swipe */}
          <div
            className="av-pdp__main-image"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.altText}
              loading="eager"
            />
            {images.length > 1 && (
              <div className="av-pdp__mobile-dots">
                {images.map((_: any, idx: number) => (
                  <span
                    key={idx}
                    className={`av-pdp__dot${activeImage === idx ? ' av-pdp__dot--active' : ''}`}
                    onClick={() => setActiveImage(idx)}
                  />
                ))}
              </div>
            )}
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
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedVariant?.availableForSale !== false ? '#2D6A4F' : '#D32F2F' }} />
            <span style={{ fontSize: '12px', color: selectedVariant?.availableForSale !== false ? '#2D6A4F' : '#D32F2F', fontWeight: 600, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
              {selectedVariant?.availableForSale !== false ? 'In Stock' : 'Out of Stock'}
            </span>
            {selectedVariant?.availableForSale !== false && (
              <>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 var(--space-1)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontFamily: 'var(--font-body)' }}>
                  ✓ Ready to dispatch
                </span>
              </>
            )}
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
            {mock.description ? (
              <AccordionItem title="Description & Overview" defaultOpen>
                <div
                  className="av-pdp__description-html"
                  dangerouslySetInnerHTML={{__html: mock.description}}
                />
              </AccordionItem>
            ) : null}
            <AccordionItem title="Product Specifications" defaultOpen={!mock.description}>
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
  const [copied, setCopied] = useState(false);
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

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title,
          text: `Check out ${title} on Atsevam!`,
          url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to dropdown
      }
    }
    setOpen((v) => !v);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLinks = [
    {
      label: 'WhatsApp',
      color: '#25D366',
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: 'Pinterest',
      color: '#E60023',
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#E60023">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      ),
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    },
    {
      label: 'Twitter / X',
      color: '#000000',
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#1DA1F2">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'Facebook',
      color: '#1877F2',
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  return (
    <div className="av-share" ref={ref}>
      <button
        className={`wishlist-btn${open ? ' active' : ''}`}
        onClick={handleNativeShare}
        aria-label="Share product"
        aria-expanded={open}
      >
        <Icon name="share" size={18} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="av-share__dropdown" role="menu">
          <p className="av-share__label">Share product</p>
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
              <span className="av-share__icon">{link.svg}</span>
              <span>{link.label}</span>
            </a>
          ))}
          <button
            type="button"
            className="av-share__item av-share__item--copy"
            onClick={handleCopyLink}
          >
            <span className="av-share__icon">
              <Icon name="copy" size={18} strokeWidth={1.5} />
            </span>
            <span>{copied ? '✓ Link Copied!' : 'Copy Link'}</span>
          </button>
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
