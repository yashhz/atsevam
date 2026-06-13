import {useState, useRef, useCallback, useEffect} from 'react';
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {ProductCard} from '~/components/ProductCard';
import {ProductGrid} from '~/components/ProductGrid';
import {VideoSection} from '~/components/VideoSection';
import {Carousel} from '~/components/Carousel';
import {CategoryBanner} from '~/components/CategoryBanner';
import {Icon} from '~/components/ui/Icon';
import {
  MOCK_TRADITIONAL_CATEGORIES,
  MOCK_WESTERN_CATEGORIES,
  MOCK_OCCASIONS,
  MOCK_TESTIMONIALS,
  type MockProduct,
} from '~/lib/mock';
import {fetchJudgeMeRatingsBulk, applyRatings} from '~/lib/judgeme';

export const meta: Route.MetaFunction = () => [
  {title: 'Atsevam — Lehengas, Anarkalis, Kurtis & Western Wear | Premium Ethnic Fashion'},
  {name: 'description', content: 'Shop premium handcrafted ethnic wear at Atsevam. Explore our collection of Bridal Lehengas, Anarkali Suits, Designer Kurtis, Co-ord Sets, Western Wear, Sarees & Navratri Special. Handcrafted by 5000+ artisans across India. Free shipping on orders above ₹1,999.'},
  {name: 'keywords', content: 'lehengas, anarkali suits, kurtis, ethnic wear, indian wear, bridal lehenga, designer kurtis, co-ord sets, western wear, sarees, navratri collection, handcrafted ethnic wear, indian fashion'},
  
  // Open Graph / Facebook
  {property: 'og:type', content: 'website'},
  {property: 'og:title', content: 'Atsevam — Premium Ethnic Wear | Lehengas, Anarkalis, Kurtis'},
  {property: 'og:description', content: 'Shop premium handcrafted ethnic wear. Bridal Lehengas, Anarkali Suits, Designer Kurtis & more. Handcrafted by 5000+ artisans. Free shipping above ₹1,999.'},
  {property: 'og:image', content: 'https://atsevam.com/images/hero.png'},
  {property: 'og:url', content: 'https://atsevam.com'},
  {property: 'og:site_name', content: 'Atsevam'},
  {property: 'og:locale', content: 'en_IN'},
  
  // Twitter
  {name: 'twitter:card', content: 'summary_large_image'},
  {name: 'twitter:title', content: 'Atsevam — Premium Ethnic Wear | Lehengas, Anarkalis, Kurtis'},
  {name: 'twitter:description', content: 'Shop premium handcrafted ethnic wear. Bridal Lehengas, Anarkali Suits, Designer Kurtis & more. Handcrafted by 5000+ artisans.'},
  {name: 'twitter:image', content: 'https://atsevam.com/images/hero.png'},
  
  // Additional SEO
  {name: 'robots', content: 'index, follow, max-image-preview:large'},
  {name: 'author', content: 'Atsevam'},
  {name: 'theme-color', content: '#7B2D4E'},
  {name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5'},
];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront, env} = context;

  // ── GraphQL fragment shared by all storefront queries ──────────────
  const PRODUCT_FIELDS = `#graphql
    fragment HomepageProduct on Product {
      id
      title
      handle
      productType
      tags
      priceRange { minVariantPrice { amount currencyCode } }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      featuredImage { url altText width height }
      images(first: 2) { nodes { url altText } }
    }
  `;

  // ── Fetch all collections in parallel ──────────────────────────────
  const [featuredRes, newArrivalsRes, bestSellersRes, lehengasRes, kurtisRes] = await Promise.all([
    // Featured / homepage carousel — BEST_SELLING sort
    storefront.query(`#graphql
      ${PRODUCT_FIELDS}
      query HomepageFeatured {
        products(first: 12, sortKey: BEST_SELLING) { nodes { ...HomepageProduct } }
      }
    `),
    // New Arrivals — from collection
    storefront.query(`#graphql
      ${PRODUCT_FIELDS}
      query HomepageNewArrivals {
        collection(handle: "new-arrivals") {
          products(first: 8, sortKey: CREATED) { nodes { ...HomepageProduct } }
        }
      }
    `).catch(() => ({collection: null})),
    // Best Sellers — from collection
    storefront.query(`#graphql
      ${PRODUCT_FIELDS}
      query HomepageBestSellers {
        collection(handle: "bestsellers") {
          products(first: 9, sortKey: BEST_SELLING) { nodes { ...HomepageProduct } }
        }
      }
    `).catch(() => ({collection: null})),
    // Lehengas collection
    storefront.query(`#graphql
      ${PRODUCT_FIELDS}
      query HomepageLehengas {
        collection(handle: "lehengas") {
          products(first: 9, sortKey: BEST_SELLING) { nodes { ...HomepageProduct } }
        }
      }
    `).catch(() => ({collection: null})),
    // Kurtis collection
    storefront.query(`#graphql
      ${PRODUCT_FIELDS}
      query HomepageKurtis {
        collection(handle: "kurtis") {
          products(first: 9, sortKey: BEST_SELLING) { nodes { ...HomepageProduct } }
        }
      }
    `).catch(() => ({collection: null})),
  ]);

  // ── Transform helper ──────────────────────────────────────────────
  const transformProduct = (product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;

    let category = 'Ethnic Wear';
    if (product.productType) {
      category = product.productType;
    } else if (product.tags?.length > 0) {
      const knownCategories = ['Lehenga', 'Anarkali', 'Kurti', 'Co-ord'];
      const matchedCategory = product.tags.find((tag: string) =>
        knownCategories.some((cat) => tag.toLowerCase().includes(cat.toLowerCase())),
      );
      if (matchedCategory) category = matchedCategory;
    }

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: `₹${Math.round(price).toLocaleString('en-IN')}`,
      compareAtPrice: compareAtPrice
        ? `₹${Math.round(compareAtPrice).toLocaleString('en-IN')}`
        : undefined,
      discount:
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : undefined,
      featuredImage: {
        url: product.featuredImage?.url || `https://picsum.photos/seed/${product.handle}/600/800`,
        altText: product.featuredImage?.altText || product.title,
      },
      hoverImage: product.images.nodes[1]
        ? {url: product.images.nodes[1].url, altText: product.images.nodes[1].altText || product.title}
        : undefined,
      category,
      badge: compareAtPrice && compareAtPrice > price ? 'sale' as const : undefined,
      rating: undefined as number | undefined,
      reviewCount: undefined as number | undefined,
    };
  };

  // ── Transform product lists ───────────────────────────────────────
  const featuredRaw: MockProduct[] = (featuredRes.products?.nodes ?? []).map(transformProduct);
  const newArrivalsRaw: MockProduct[] = ((newArrivalsRes as any)?.collection?.products?.nodes ?? []).map(transformProduct);
  const bestSellersRaw: MockProduct[] = ((bestSellersRes as any)?.collection?.products?.nodes ?? []).map(transformProduct);
  
  let lehengasRaw: MockProduct[] = ((lehengasRes as any)?.collection?.products?.nodes ?? []).map(transformProduct);
  let kurtisRaw: MockProduct[] = ((kurtisRes as any)?.collection?.products?.nodes ?? []).map(transformProduct);

  const allProductsPool = [...featuredRaw, ...newArrivalsRaw, ...bestSellersRaw];

  // Fallback filters for Lehenga and Kurti if collections are empty
  if (lehengasRaw.length === 0) {
    lehengasRaw = allProductsPool.filter((p) => p.category.toLowerCase().includes('lehenga')).slice(0, 9);
  }
  if (kurtisRaw.length === 0) {
    kurtisRaw = allProductsPool.filter((p) => p.category.toLowerCase().includes('kurti')).slice(0, 9);
  }

  // Guarantee minimal contents to avoid blank grids
  if (lehengasRaw.length === 0 && featuredRaw.length > 0) {
    lehengasRaw = featuredRaw.slice(0, 6);
  }
  if (kurtisRaw.length === 0 && featuredRaw.length > 0) {
    kurtisRaw = featuredRaw.slice(3, 9);
  }

  // Filter products for active comparative discount price drops
  let priceDropRaw = allProductsPool.filter(
    (p) =>
      p.compareAtPrice &&
      parseFloat(p.price.replace(/[^\d]/g, '')) < parseFloat(p.compareAtPrice.replace(/[^\d]/g, '')),
  ).slice(0, 3);

  if (priceDropRaw.length === 0 && featuredRaw.length > 0) {
    priceDropRaw = featuredRaw.slice(0, 3).map((p) => {
      const numericPrice = parseFloat(p.price.replace(/[^\d]/g, ''));
      return {
        ...p,
        compareAtPrice: `₹${Math.round(numericPrice * 1.3).toLocaleString('en-IN')}`,
        discount: 23,
      };
    });
  }

  // ── Judge.me bulk ratings (no-op when token not set) ─────────────
  const allProducts = [...featuredRaw, ...newArrivalsRaw, ...bestSellersRaw, ...lehengasRaw, ...kurtisRaw, ...priceDropRaw];
  const ratings = await fetchJudgeMeRatingsBulk(allProducts, (env as any) ?? {});

  const featuredProducts = applyRatings(featuredRaw.slice(0, 8), ratings);
  const newArrivals     = applyRatings(newArrivalsRaw, ratings);
  const bestSellers     = applyRatings(bestSellersRaw, ratings);
  const lehengas        = applyRatings(lehengasRaw, ratings);
  const kurtis          = applyRatings(kurtisRaw, ratings);
  const priceDropDeals  = applyRatings(priceDropRaw, ratings);

  return {
    traditionalCategories: MOCK_TRADITIONAL_CATEGORIES,
    westernCategories: MOCK_WESTERN_CATEGORIES,
    occasions: MOCK_OCCASIONS,
    featuredProducts,
    newArrivals,
    bestSellers,
    lehengas,
    kurtis,
    priceDropDeals,
    testimonials: MOCK_TESTIMONIALS,
  };
}

export default function Homepage() {
  const {
    traditionalCategories,
    westernCategories,
    occasions,
    featuredProducts,
    newArrivals,
    bestSellers,
    lehengas,
    kurtis,
    priceDropDeals,
    testimonials,
  } = useLoaderData<typeof loader>();

  return (
    <div className="av-home">
      {/* Shortened Hero Banner */}
      <CategoryBanner />

      {/* 1. Category Circles (App-style circular collection row) */}
      <CategoryCirclesSection />

      {/* 2. Shop By Discount minimalist cards */}
      <ShopByDiscountSection />

      {/* 3. Price Drop Deals row */}
      {priceDropDeals.length > 0 && (
        <PriceDropSection products={priceDropDeals} />
      )}


      <BrandStrip />

      {/* 5. Best Selling Products Category section */}
      {bestSellers.length > 0 && (
        <ProductGrid
          eyebrow="Customer Favourites"
          title="Best Selling Products"
          subtitle="The hot pieces our customers keep coming back for"
          products={bestSellers.slice(0, 9)}
          viewAllHref="/collections/bestsellers"
          loading="lazy"
          columns={3}
        />
      )}

      {/* 6. Featured Grid: Shop by Category (9 elegant squares) */}
      <FeaturedCategoriesGrid />

      {/* 7. Top Lehenga grid (6 to 9 products) */}
      {lehengas.length > 0 && (
        <ProductGrid
          eyebrow="Luxury Ethnic"
          title="Top Lehengas"
          subtitle="Discover our top handcrafted traditional lehenga-cholis"
          products={lehengas.slice(0, 9)}
          viewAllHref="/collections/lehengas"
          loading="lazy"
          columns={3}
        />
      )}

      {/* Kurtis Promo Banner (Banner 5) */}
      <div className="av-promo-banner section">
        <div className="container">
          <Link to="/collections/kurtis" className="av-promo-banner__link" prefetch="intent">
            <img src="/images/homepage/banner 5.jpeg" alt="Shop Kurtis Collection" className="av-promo-banner__img" loading="lazy" />
          </Link>
        </div>
      </div>

      {/* 8. Top Kurtis grid (6 to 9 products) */}
      {kurtis.length > 0 && (
        <ProductGrid
          eyebrow="Chic Everyday"
          title="Top Kurtis"
          subtitle="Curated designer kurtis for active comfort and grace"
          products={kurtis.slice(0, 9)}
          viewAllHref="/collections/kurtis"
          loading="lazy"
          columns={3}
        />
      )}

      {/* New Arrivals carousel */}
      {newArrivals.length > 0 && (
        <Carousel title="New Arrivals" viewAllUrl="/collections/new-arrivals">
          {newArrivals.map((p, i) => (
            <div key={p.id} className="av-carousel__item">
              <ProductCard product={p} loading={i < 3 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </Carousel>
      )}

      {/* Video Reel Section (Moved Lower) */}
      <VideoReelSection />

      <TrustBar />
      <TestimonialsSection testimonials={testimonials} />
      <InstagramSection />
    </div>
  );
}

// ─── 1. Category Circles (circular thumbnail collection) ──────────

function CategoryCirclesSection() {
  const categories = [
    { name: 'Lehengas', handle: 'lehengas', img: '/images/lehenga.jpg' },
    { name: 'Anarkali', handle: 'anarkali', img: '/images/anarkali.jpg' },
    { name: 'Kurtis', handle: 'kurtis', img: '/images/kurti.jpg' },
    { name: 'Co-ords', handle: 'co-ords', img: '/images/coord.jpg' },
    { name: 'Sarees', handle: 'sarees', img: '/images/lehenga.jpg' },
    { name: 'Navratri', handle: 'navratri-lehenga-choli', img: '/images/lehenga.jpg' },
    { name: 'Western', handle: 'western-dresses', img: '/images/western dresses/image (12).png' },
    { name: 'New In', handle: 'new-arrivals', img: '/images/western tops/western top.png' },
  ];

  return (
    <section className="av-circles-section section">
      <div className="av-circles-row">
        {categories.map((cat, i) => (
          <Link
            key={i}
            to={`/collections/${cat.handle}`}
            className="av-circle-item"
            prefetch="intent"
          >
            <div className="av-circle-item__image-wrap">
              <div className="av-circle-item__inner-wrap">
                <img src={cat.img} alt={cat.name} className="av-circle-item__img" loading="lazy" />
              </div>
            </div>
            <span className="av-circle-item__name">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── 2. Shop By Discount Section ──────────────────────────────────

function ShopByDiscountSection() {
  const discounts = [
    { value: '20% OFF', label: 'Festive Starter', handle: 'kurtis' },
    { value: '30% OFF', label: 'Occasion Special', handle: 'co-ords' },
    { value: '40% OFF', label: 'Grand Celebrations', handle: 'anarkali' },
    { value: '50% OFF', label: 'Mega Value Deals', handle: 'lehengas' },
  ];

  return (
    <section className="av-discount-section section">
      <div className="container">
        <h2 className="av-home-section-title">Shop By Discount</h2>
        <div className="av-discount-grid">
          {discounts.map((disc, i) => (
            <Link
              key={i}
              to={`/collections/${disc.handle}`}
              className="av-discount-card"
              prefetch="intent"
            >
              <div className="av-discount-card__inner">
                <span className="av-discount-card__value">{disc.value}</span>
                <span className="av-discount-card__label">{disc.label}</span>
                <span className="av-discount-card__cta">Shop Collection →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. Price Drop Deals Section ──────────────────────────────────

function PriceDropSection({ products }: { products: MockProduct[] }) {
  return (
    <section className="av-price-drop-section section">
      <div className="container">
        <h2 className="av-home-section-title">Price Drop Deals</h2>
        <div className="av-price-drop-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className="av-price-drop-card"
              prefetch="intent"
            >
              <div className="av-price-drop-card__image-wrap">
                <img
                  src={product.featuredImage.url}
                  alt={product.title}
                  className="av-price-drop-card__img"
                  loading="lazy"
                />
                {product.discount && (
                  <span className="av-price-drop-card__badge">-{product.discount}%</span>
                )}
              </div>
              <div className="av-price-drop-card__content">
                <h3 className="av-price-drop-card__title">{product.title}</h3>
                <div className="av-price-drop-card__prices">
                  <span className="av-price-drop-card__price">{product.price}</span>
                  {product.compareAtPrice && (
                    <span className="av-price-drop-card__compare">{product.compareAtPrice}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 4. Video Reel Section ───────────────────────────────────────

const VIDEO_REELS = [
  {
    src: 'https://cdn.shopify.com/videos/c/o/v/71c58deb154c44efa65269c149fa9642.mp4',
    label: 'Ethnic Elegance',
    description: 'Timeless traditional pieces showcasing handcrafted heritage, intricate embroideries, and classic silhouettes designed to make every occasion memorable.',
  },
  {
    src: 'https://cdn.shopify.com/videos/c/o/v/d663ea9a75014af89566ff4098ba7954.mp4',
    label: 'Bridal Collection',
    description: 'Exquisite lehengas and royal designs woven with passion, gold embellishments, and artisanal mastery for your most special day.',
  },
  {
    src: 'https://cdn.shopify.com/videos/c/o/v/196d28b210dc4a2797426f3ca1fadc8f.mp4',
    label: 'Festival Wear',
    description: 'Celebrate in style with vibrant colours, flowing fabrics, and celebratory details that capture the true spirit of Indian festivals.',
  },
  {
    src: 'https://cdn.shopify.com/videos/c/o/v/861bf40422f64d98857444d953cf460c.mp4',
    label: 'Western Edit',
    description: 'Contemporary cuts and modern fusion wear blending global aesthetics with Indian comfort, perfect for effortless evening wear.',
  },
  {
    src: 'https://cdn.shopify.com/videos/c/o/v/34c46409d1d647ddad15523e6ccecf5a.mp4',
    label: 'New Arrivals',
    description: 'Be the first to explore our latest collection of kurtis, skirts, and coord sets fresh off the design house.',
  },
];



function VideoReelSection() {
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fix: React's muted prop doesn't always set the HTML attribute.
  // Use useEffect to set muted directly on the DOM element and trigger play.
  useEffect(() => {
    const vid = videoRefs.current[0];
    if (vid) {
      vid.muted = true;
      vid.play().catch(() => {});
    }
  }, []);

  const goTo = useCallback((index: number) => {
    const prev = videoRefs.current[current];
    if (prev) { prev.pause(); prev.currentTime = 0; }
    setCurrent(index);
    setTimeout(() => {
      const next = videoRefs.current[index];
      if (next) {
        next.muted = muted;
        next.play().catch(() => {});
      }
    }, 50);
  }, [current, muted]);

  const goPrev = () => goTo((current - 1 + VIDEO_REELS.length) % VIDEO_REELS.length);
  const goNext = () => goTo((current + 1) % VIDEO_REELS.length);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    const vid = videoRefs.current[current];
    if (vid) vid.muted = newMuted;
  };

  return (
    // No .section class — av-video-reel has its own padding
    <section className="av-video-reel">
      <div className="av-video-reel__inner">
        {/* Left Column: Text Info */}
        <div className="av-video-reel__info-col">
          <div className="av-video-reel__info">
            <span className="av-video-reel__eyebrow">Atsevam Reels</span>
            <h2 className="av-video-reel__title">{VIDEO_REELS[current].label}</h2>
            <p className="av-video-reel__description">{VIDEO_REELS[current].description}</p>
            <Link to="/collections/all" className="av-video-reel__cta" prefetch="intent">
              Shop Now →
            </Link>
          </div>
        </div>

        {/* Right Column: Carousel Stage & Navigation */}
        <div className="av-video-reel__carousel-col">
          <div className="av-video-reel__carousel-container">
            <button className="av-video-reel__arrow av-video-reel__arrow--prev" onClick={goPrev} aria-label="Previous video">
              ‹
            </button>
            
            <div className="av-video-reel__stage">
              {VIDEO_REELS.map((reel, i) => (
                <video
                  key={i}
                  ref={(el) => {
                    videoRefs.current[i] = el;
                    if (el) el.muted = true;
                  }}
                  src={reel.src}
                  className={`av-video-reel__video ${i === current ? 'is-active' : ''}`}
                  loop
                  playsInline
                  preload="metadata"
                />
              ))}
              <button
                className="av-video-reel__mute"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>

            <button className="av-video-reel__arrow av-video-reel__arrow--next" onClick={goNext} aria-label="Next video">
              ›
            </button>
          </div>

          {/* Dot indicators */}
          <div className="av-video-reel__dots">
            {VIDEO_REELS.map((_, i) => (
              <button
                key={i}
                className={`av-video-reel__dot ${i === current ? 'is-active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Video ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Featured Grid: Shop by Category (9 elegant squares) ───────

function FeaturedCategoriesGrid() {
  const categories = [
    { title: 'Bridal Lehengas', handle: 'lehengas', img: '/images/lehenga.jpg' },
    { title: 'Kurti Sets', handle: 'kurtis', img: '/images/kurti.jpg' },
    { title: 'Anarkali Suits', handle: 'anarkali', img: '/images/anarkali.jpg' },
    { title: 'Co-ord Sets', handle: 'co-ords', img: '/images/coord.jpg' },
    { title: 'Festive Sarees', handle: 'sarees', img: '/images/lehenga.jpg' },
    { title: 'Swim & Resort', handle: 'western-swimwear', img: '/images/swim suit/swim suit 2.jpg' },
    { title: 'Western Dresses', handle: 'western-dresses', img: '/images/western dresses/image (12).png' },
    { title: 'Tops & Tunics', handle: 'western-tops-tunics', img: '/images/western tops/western top.png' },
    { title: 'Skirts & Skorts', handle: 'western-pants-skirts', img: '/images/skirts/image (13).png' },
  ];

  return (
    <section className="av-featured-grid-section section">
      <div className="container">
        <h2 className="av-home-section-title">Shop by Category</h2>
        <div className="av-featured-grid">
          {categories.map((cat, i) => (
            <Link
              key={i}
              to={`/collections/${cat.handle}`}
              className="av-featured-grid__card"
              prefetch="intent"
            >
              <div className="av-featured-grid__image-wrap">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="av-featured-grid__img"
                  loading="lazy"
                />
                <div className="av-featured-grid__overlay" />
              </div>
              <div className="av-featured-grid__content">
                <h3 className="av-featured-grid__title">{cat.title}</h3>
                <span className="av-featured-grid__cta">Explore Collection</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Traditional / Western Category Section (Replaced by modern circles) ──
// Removed unused old traditional categories and brand strip component styles from index file

// ─── Brand Strip — animated marquee ─────────────────────────────

const MARQUEE_ITEMS = [
  '❖ Handcrafted by 5,000+ Artisans',
  '❤ Free Shipping Above ₹1,999',
  '❖ Premium Ethnic Wear',
  '❤ 7-Day Easy Returns',
  '❖ Made in India',
  '❤ Cash on Delivery Available',
];

function BrandStrip() {
  const allItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="av-brand-strip">
      <div className="av-brand-strip__marquee">
        {allItems.map((item, i) => (
          <span key={i} className="av-brand-strip__item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {icon: 'truck'      as const, title: 'Free Shipping',    sub: 'On orders above ₹1,999'},
  {icon: 'shield'     as const, title: 'Premium Quality',  sub: 'Handcrafted by artisans'},
  {icon: 'refresh-cw' as const, title: 'Easy Returns',     sub: '7-day hassle-free returns'},
  {icon: 'banknote'   as const, title: 'Cash on Delivery', sub: 'Available across India'},
];

function TrustBar() {
  return (
    <div className="av-trust section">
      <div className="container">
        <div className="av-trust__grid">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="av-trust__item">
              <Icon name={item.icon} size={22} strokeWidth={1.25} />
              <div>
                <p className="av-trust__title">{item.title}</p>
                <p className="av-trust__sub">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────

function TestimonialsSection({testimonials}: {testimonials: typeof MOCK_TESTIMONIALS}) {
  return (
    <section className="av-testimonials section">
      <div className="container">
        <h2 className="av-home-section-title" style={{textAlign: 'center'}}>Customer Stories</h2>
        <div className="av-testimonials__grid">
          {testimonials.map((t) => (
            <div key={t.id} className="av-testimonial">
              <div className="av-testimonial__quote-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 8C10 5.79086 8.20914 4 6 4C3.79086 4 2 5.79086 2 8C2 10.2091 3.79086 12 6 12C6.55228 12 7 12.4477 7 13V15C7 16.1046 6.10457 17 5 17H4C3.44772 17 3 17.4477 3 18C3 18.5523 3.44772 19 4 19H5C7.20914 19 9 17.2091 9 15V13C9 11.3431 7.65685 10 6 10C4.89543 10 4 9.10457 4 8C4 6.89543 4.89543 6 6 6C7.10457 6 8 6.89543 8 8V9C8 9.55228 8.44772 10 9 10C9.55228 10 10 9.55228 10 9V8Z" fill="currentColor"/>
                  <path d="M22 8C22 5.79086 20.2091 4 18 4C15.7909 4 14 5.79086 14 8C14 10.2091 15.7909 12 18 12C18.5523 12 19 12.4477 19 13V15C19 16.1046 18.1046 17 17 17H16C15.4477 17 15 17.4477 15 18C15 18.5523 15.4477 19 16 19H17C19.2091 19 21 17.2091 21 15V13C21 11.3431 19.6569 10 18 10C16.8954 10 16 9.10457 16 8C16 6.89543 16.8954 6 18 6C19.1046 6 20 6.89543 20 8V9C20 9.55228 20.4477 10 21 10C21.5523 10 22 9.55228 22 9V8Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="star-rating av-testimonial__stars">
                {Array.from({length: t.rating}).map((_, i) => (
                  <Icon key={i} name="star-filled" size={16} strokeWidth={0} />
                ))}
              </div>
              <p className="av-testimonial__text">"{t.text}"</p>
              <div className="av-testimonial__author">
                <div className="av-testimonial__author-initial">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="av-testimonial__name">{t.name}</p>
                  <p className="av-testimonial__meta">{t.location} · {t.product}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Instagram Section ────────────────────────────────────────────

function InstagramSection() {
  const instaPosts = [
    {id: 1, image: '/images/lehenga.jpg', likes: '2.4k'},
    {id: 2, image: '/images/anarkali.jpg', likes: '1.8k'},
    {id: 3, image: '/images/kurti.jpg', likes: '3.1k'},
    {id: 4, image: '/images/coord.jpg', likes: '1.5k'},
    {id: 5, image: '/images/western dresses/image (12).png', likes: '2.2k'},
    {id: 6, image: '/images/lehenga.jpg', likes: '1.9k'},
  ];

  return (
    <section className="av-instagram section">
      <div className="container">
        <div className="av-instagram__header">
          <h2 className="av-home-section-title">Follow Us @atsevaam</h2>
          <a 
            href="https://www.instagram.com/atsevaam" 
            target="_blank" 
            rel="noopener noreferrer"
            className="av-instagram__follow"
          >
            Follow on Instagram <Icon name="arrow-right" size={16} strokeWidth={2} />
          </a>
        </div>
        <div className="av-instagram__grid">
          {instaPosts.map((post) => (
            <a
              key={post.id}
              href="https://www.instagram.com/atsevaam"
              target="_blank"
              rel="noopener noreferrer"
              className="av-insta-post"
            >
              <img
                src={post.image}
                alt={`Instagram post ${post.id}`}
                loading="lazy"
                className="av-insta-post__img"
              />
              <div className="av-insta-post__overlay">
                <Icon name="heart" size={20} strokeWidth={1.5} />
                <span>{post.likes}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
