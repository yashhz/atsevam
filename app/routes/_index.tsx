import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {ProductCard} from '~/components/ProductCard';
import {Carousel} from '~/components/Carousel';
import {Icon} from '~/components/ui/Icon';
import {
  MOCK_TRADITIONAL_CATEGORIES,
  MOCK_WESTERN_CATEGORIES,
  MOCK_OCCASIONS,
  MOCK_TESTIMONIALS,
} from '~/lib/mock';

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
  
  // Twitter
  {name: 'twitter:card', content: 'summary_large_image'},
  {name: 'twitter:title', content: 'Atsevam — Premium Ethnic Wear | Lehengas, Anarkalis, Kurtis'},
  {name: 'twitter:description', content: 'Shop premium handcrafted ethnic wear. Bridal Lehengas, Anarkali Suits, Designer Kurtis & more. Handcrafted by 5000+ artisans.'},
  {name: 'twitter:image', content: 'https://atsevam.com/images/hero.png'},
  
  // Additional SEO
  {name: 'robots', content: 'index, follow'},
  {name: 'author', content: 'Atsevam'},
  {name: 'theme-color', content: '#8B2635'},
];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  // Fetch real products from Shopify
  const {products} = await storefront.query(
    `#graphql
      query HomepageProducts {
        products(first: 12, sortKey: BEST_SELLING) {
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
                currencyCode
              }
            }
            featuredImage {
              url
              altText
              width
              height
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

  // Transform Shopify products to match mock data structure
  const transformProduct = (product: any) => {
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount 
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined;
    
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
      hoverImage: product.images.nodes[1] ? {
        url: product.images.nodes[1].url,
        altText: product.images.nodes[1].altText || product.title,
      } : undefined,
      category,
      badge: compareAtPrice && compareAtPrice > price ? 'sale' as const : undefined,
      rating: undefined,
      reviewCount: undefined,
    };
  };

  const transformedProducts = products.nodes.map(transformProduct);
  const featuredProducts = transformedProducts.slice(0, 8);

  return {
    traditionalCategories: MOCK_TRADITIONAL_CATEGORIES,
    westernCategories: MOCK_WESTERN_CATEGORIES,
    occasions: MOCK_OCCASIONS,
    featuredProducts,
    testimonials: MOCK_TESTIMONIALS,
  };
}

export default function Homepage() {
  const {traditionalCategories, westernCategories, occasions, featuredProducts, testimonials} =
    useLoaderData<typeof loader>();

  return (
    <div className="av-home">
      <HeroBanner />
      <TraditionalCategoriesSection categories={traditionalCategories} />
      <BrandStrip />
      <VideoSection />
      <WesternCategoriesSection categories={westernCategories} />
      <ShopByOccasion occasions={occasions} />
      <Carousel title="Handpicked for You" viewAllUrl="/collections/all">
        {featuredProducts.map((p, i) => (
          <div key={p.id} className="av-carousel__item">
            <ProductCard product={p} loading={i < 3 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </Carousel>
      <TrustBar />
      <TestimonialsSection testimonials={testimonials} />
      <InstagramSection />
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────

function HeroBanner() {
  return (
    <section className="av-hero">
      {/* Background image */}
      <div className="av-hero__bg">
        <img
          src="/images/hero.png"
          alt="Atsevam — The Festive Edit"
          className="av-hero__img"
          loading="eager"
          fetchPriority="high"
        />
        <div className="av-hero__overlay" />
      </div>

      {/* Content */}
      <div className="av-hero__content">
        <p className="av-hero__eyebrow">New Arrivals · SS 2026</p>
        <h1 className="av-hero__headline">The Festive Edit</h1>
        <p className="av-hero__sub">
          Handcrafted for the moments that matter.
        </p>
        <div className="av-hero__cta-group">
          <Link to="/collections/lehengas" className="btn btn-secondary btn-lg av-hero__cta">
            Shop Lehengas
          </Link>
          <Link to="/collections/kurtis" className="av-hero__cta-ghost">
            Explore Kurtis →
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="av-hero__scroll" aria-hidden="true">
        <Icon name="chevron-down" size={20} strokeWidth={1} />
      </div>
    </section>
  );
}

// ─── Traditional Categories Section ───────────────────────────────

function TraditionalCategoriesSection({categories}: {categories: typeof MOCK_TRADITIONAL_CATEGORIES}) {
  return (
    <section className="av-category-section section">
      <div className="container">
        <h2 className="av-category-section__heading">Traditional Ethnic Wear</h2>
        <div className="av-category-scroll">
          <div className="av-category-scroll__inner">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/collections/${cat.handle}`}
                prefetch="intent"
                className="av-category-card"
              >
                <div className="av-category-card__img-wrap">
                  <img
                    src={cat.image.url}
                    alt={cat.image.altText}
                    loading="lazy"
                    className="av-category-card__img"
                  />
                  <div className="av-category-card__overlay" />
                </div>
                <div className="av-category-card__content">
                  <h3 className="av-category-card__title">{cat.title}</h3>
                  <span className="av-category-card__cta">
                    Explore <Icon name="arrow-right" size={14} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Western Categories Section ───────────────────────────────────

function WesternCategoriesSection({categories}: {categories: typeof MOCK_WESTERN_CATEGORIES}) {
  return (
    <section className="av-category-section section">
      <div className="container">
        <h2 className="av-category-section__heading">Western Collection</h2>
        <div className="av-category-scroll">
          <div className="av-category-scroll__inner">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/collections/${cat.handle}`}
                prefetch="intent"
                className="av-category-card"
              >
                <div className="av-category-card__img-wrap">
                  <img
                    src={cat.image.url}
                    alt={cat.image.altText}
                    loading="lazy"
                    className="av-category-card__img"
                  />
                  <div className="av-category-card__overlay" />
                </div>
                <div className="av-category-card__content">
                  <h3 className="av-category-card__title">{cat.title}</h3>
                  <span className="av-category-card__cta">
                    Explore <Icon name="arrow-right" size={14} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
  // Duplicate items so the scroll is seamless (first half + second half loop)
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

// ─── Video Section ────────────────────────────────────────────────

function VideoSection() {
  return (
    <section className="av-video-section section">
      <div className="container">
        <div className="av-video-section__layout">
          {/* Left side: Text content */}
          <div className="av-video-section__text">
            <h2 className="av-video-section__headline">Crafted with Love</h2>
            <p className="av-video-section__description">
              Every piece at Atsevam tells a story of tradition, artistry, and dedication. 
              Watch our skilled artisans bring each design to life using time-honored techniques 
              passed down through generations.
            </p>
            <p className="av-video-section__description">
              From intricate embroidery to delicate zari work, every stitch is a testament 
              to the craftsmanship that makes our ethnic wear truly special.
            </p>
            <div className="av-video-section__stats">
              <div className="av-video-stat">
                <span className="av-video-stat__number">5,000+</span>
                <span className="av-video-stat__label">Artisans</span>
              </div>
              <div className="av-video-stat">
                <span className="av-video-stat__number">100%</span>
                <span className="av-video-stat__label">Handcrafted</span>
              </div>
              <div className="av-video-stat">
                <span className="av-video-stat__number">50+</span>
                <span className="av-video-stat__label">Years Legacy</span>
              </div>
            </div>
          </div>

          {/* Right side: Two vertical videos */}
          <div className="av-video-section__videos">
            <div className="av-vertical-video">
              <div className="av-vertical-video__wrapper">
                <video
                  className="av-vertical-video__player"
                  poster="/images/lehenga.jpg"
                  controls
                  preload="metadata"
                >
                  <source src="/videos/bts.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="av-vertical-video__play">
                  <Icon name="play" size={28} strokeWidth={1.5} />
                </div>
              </div>
              <p className="av-vertical-video__caption">Behind the Scenes</p>
            </div>

            <div className="av-vertical-video">
              <div className="av-vertical-video__wrapper">
                <video
                  className="av-vertical-video__player"
                  poster="/images/anarkali.jpg"
                  controls
                  preload="metadata"
                >
                  <source src="/videos/craftsmanship.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="av-vertical-video__play">
                  <Icon name="play" size={28} strokeWidth={1.5} />
                </div>
              </div>
              <p className="av-vertical-video__caption">The Art of Embroidery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Shop by Occasion ─────────────────────────────────────────────

function ShopByOccasion({occasions}: {occasions: typeof MOCK_OCCASIONS}) {
  return (
    <section className="av-occasions section">
      <div className="container">
        <h2 className="section-heading--large" style={{textAlign: 'center'}}>Shop by Occasion</h2>
        <div className="av-occasions__grid">
          {occasions.map((occ) => (
            <Link
              key={occ.id}
              to={`/collections/${occ.handle}`}
              prefetch="intent"
              className="av-occasion-card"
            >
              <div className="av-occasion-card__img-wrap">
                <img
                  src={occ.image.url}
                  alt={occ.image.altText}
                  loading="lazy"
                  className="av-occasion-card__img"
                />
                <div className="av-occasion-card__overlay" />
              </div>
              <div className="av-occasion-card__content">
                <h3 className="av-occasion-card__title">{occ.title}</h3>
                <p className="av-occasion-card__subtitle">{occ.subtitle}</p>
                <div className="av-occasion-card__arrow">
                  <Icon name="arrow-right" size={18} strokeWidth={2} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
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
        <h2 className="section-heading">Customer Stories</h2>
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
          <h2 className="section-heading--large">Follow Us @atsevaam</h2>
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
