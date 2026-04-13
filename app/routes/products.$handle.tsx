import {useLoaderData} from 'react-router';
import {useState, useRef} from 'react';
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
import {ProductCard} from '~/components/ProductCard';
import {MOCK_PRODUCT_DETAIL} from '~/lib/mock';
import type {MockProductDetail} from '~/lib/mock';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `Avestam | ${data?.product?.title ?? 'Product'}`},
  {rel: 'canonical', href: `/products/${data?.product?.handle}`},
];

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
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
  
  // Transform Shopify product to match display structure
  const transformedProduct: MockProductDetail = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    category: product.tags?.[0] || 'Lehenga Choli',
    badge: (product.tags?.includes('new') ? 'new' : product.tags?.includes('sale') ? 'sale' : null) as 'new' | 'sale' | null,
    price: `₹${Math.round(parseFloat(product.selectedOrFirstAvailableVariant?.price.amount || '0')).toLocaleString('en-IN')}`,
    compareAtPrice: product.selectedOrFirstAvailableVariant?.compareAtPrice 
      ? `₹${Math.round(parseFloat(product.selectedOrFirstAvailableVariant.compareAtPrice.amount)).toLocaleString('en-IN')}`
      : null,
    rating: null,
    reviewCount: 0,
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
      hoverImage: product.images.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : null,
      category: product.tags[0] || 'Lehenga Choli',
      badge: compareAtPrice && compareAtPrice > price ? 'sale' : null,
      rating: null,
      reviewCount: null,
    };
  });
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

// ─── Page ─────────────────────────────────────────────────────────

export default function Product() {
  const {product, mockProduct, useMock} = useLoaderData<typeof loader>();
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      <div className="av-breadcrumb container">
        <a href="/" className="av-breadcrumb__item">Home</a>
        <span className="av-breadcrumb__sep">/</span>
        <a href={`/collections/${mock.category.toLowerCase()}`} className="av-breadcrumb__item">
          {mock.category}
        </a>
        <span className="av-breadcrumb__sep">/</span>
        <span className="av-breadcrumb__item av-breadcrumb__item--active">{mock.title}</span>
      </div>

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
          {/* Top meta row */}
          <div className="av-pdp__meta-row">
            <div className="av-pdp__badges">
              {mock.badge && <Badge variant={mock.badge as 'new' | 'sale' | 'bestseller' | 'top-rated'} />}
              <span className="pill">{mock.category}</span>
            </div>
            <div className="av-pdp__actions-top">
              <button
                className={`wishlist-btn${wishlisted ? ' active' : ''}`}
                onClick={() => setWishlisted((v) => !v)}
                aria-label="Add to wishlist"
              >
                <Icon name={wishlisted ? 'heart-filled' : 'heart'} size={18} strokeWidth={1.5} />
              </button>
              <button className="wishlist-btn" aria-label="Share">
                <Icon name="share" size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="av-pdp__title">{mock.title}</h1>

          {/* Rating */}
          {mock.rating && mock.rating > 0 && (
            <div className="star-rating av-pdp__rating">
              {Array.from({length: 5}).map((_, i) => (
                <Icon
                  key={i}
                  name="star-filled"
                  size={14}
                  strokeWidth={0}
                  className={i < Math.floor(mock.rating || 0) ? '' : 'av-pdp__star--empty'}
                />
              ))}
              <span className="av-pdp__rating-score">{mock.rating.toFixed(1)}</span>
              <span className="star-rating__count">({mock.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="av-pdp__price-block">
            <span className="av-pdp__price">{mock.price}</span>
            {mock.compareAtPrice && (
              <span className="av-pdp__compare">{mock.compareAtPrice}</span>
            )}
            <span className="av-pdp__tax-note">MRP inclusive of all taxes</span>
          </div>

          {/* Urgency tags */}
          <div className="av-pdp__urgency">
            <span className="av-pdp__urgency-tag av-pdp__urgency-tag--stock">
              <Icon name="star" size={12} strokeWidth={1.5} />
              Only 3 left — selling fast
            </span>
            <span className="av-pdp__urgency-tag av-pdp__urgency-tag--shipping">
              <Icon name="truck" size={12} strokeWidth={1.5} />
              Free shipping on this order
            </span>
          </div>

          {/* Size selector */}
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
              {/* You may also like */}
      {mock.relatedProducts && mock.relatedProducts.length > 0 && (
        <section className="av-pdp__related section">
          <div className="container">
            <h2 className="section-heading">You May Also Like</h2>
            <div className="av-pdp__related-grid">
              {mock.relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
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

  return (
    <button
      className={`btn btn-primary btn-full btn-lg av-pdp__atc${added ? ' av-pdp__atc--added' : ''}`}
      onClick={() => {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
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
    descriptionHtml
    description
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
