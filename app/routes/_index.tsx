import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {ProductCard} from '~/components/ProductCard';
import {Carousel} from '~/components/Carousel';
import {Icon} from '~/components/ui/Icon';
import {
  MOCK_FEATURED_CATEGORIES,
  MOCK_OCCASIONS,
  MOCK_TESTIMONIALS,
} from '~/lib/mock';

export const meta: Route.MetaFunction = () => [
  {title: 'Atsevam — Handcrafted Ethnic Wear'},
  {name: 'description', content: 'Premium handcrafted ethnic wear — Bridal Lehengas, Anarkalis, Kurtis and Co-ords.'},
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
    featuredCategories: MOCK_FEATURED_CATEGORIES,
    occasions: MOCK_OCCASIONS,
    featuredProducts,
    testimonials: MOCK_TESTIMONIALS,
  };
}

export default function Homepage() {
  const {featuredCategories, occasions, featuredProducts, testimonials} =
    useLoaderData<typeof loader>();

  return (
    <div className="av-home">
      <HeroBanner />
      <FeaturedCategories categories={featuredCategories} />
      <BrandStrip />
      <VideoSection />
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

// ─── Featured Categories ──────────────────────────────────────────

function FeaturedCategories({categories}: {categories: typeof MOCK_FEATURED_CATEGORIES}) {
  return (
    <section className="av-featured-cats section">
      <div className="container">
        <h2 className="section-heading--large" style={{textAlign: 'center'}}>Shop by Category</h2>
        <div className="av-featured-cats__grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/collections/${cat.handle}`}
              prefetch="intent"
              className="av-featured-cat"
            >
              <div className="av-featured-cat__img-wrap">
                <img
                  src={cat.image.url}
                  alt={cat.image.altText}
                  loading="lazy"
                  className="av-featured-cat__img"
                />
                <div className="av-featured-cat__overlay" />
              </div>
              <div className="av-featured-cat__content">
                <h3 className="av-featured-cat__title">{cat.title}</h3>
                <span className="av-featured-cat__cta">
                  Explore <Icon name="arrow-right" size={16} strokeWidth={2} />
                </span>
              </div>
            </Link>
          ))}
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
        <div className="av-video-section__content">
          <h2 className="av-video-section__headline">Crafted with Love</h2>
          <p className="av-video-section__sub">
            Watch our artisans bring each piece to life with traditional techniques passed down through generations.
          </p>
        </div>
        <div className="av-video-section__grid">
          <div className="av-video-card av-video-card--large">
            <div className="av-video-card__wrapper">
              <video
                className="av-video-card__video"
                poster="/images/hero.png"
                controls
                preload="metadata"
              >
                <source src="/videos/bts.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="av-video-card__play">
                <Icon name="play" size={32} strokeWidth={1.5} />
              </div>
            </div>
            <p className="av-video-card__title">Behind the Scenes</p>
          </div>
          <div className="av-video-card">
            <div className="av-video-card__wrapper">
              <video
                className="av-video-card__video"
                poster="/images/lehenga.jpg"
                controls
                preload="metadata"
              >
                <source src="/videos/craftsmanship.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="av-video-card__play">
                <Icon name="play" size={24} strokeWidth={1.5} />
              </div>
            </div>
            <p className="av-video-card__title">The Art of Embroidery</p>
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
              <div className="star-rating av-testimonial__stars">
                {Array.from({length: t.rating}).map((_, i) => (
                  <Icon key={i} name="star-filled" size={13} strokeWidth={0} />
                ))}
              </div>
              <p className="av-testimonial__text">"{t.text}"</p>
              <div className="av-testimonial__author">
                <img
                  src={t.image}
                  alt={t.name}
                  className="av-testimonial__avatar"
                  loading="lazy"
                />
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
          <h2 className="section-heading--large">Follow Us @atsevam</h2>
          <a 
            href="https://instagram.com/atsevam" 
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
              href="https://instagram.com/atsevam"
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
