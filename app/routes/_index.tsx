import {Link, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import type {Route} from './+types/_index';
import {ProductCard} from '~/components/ProductCard';
import {Carousel} from '~/components/Carousel';
import {Icon} from '~/components/ui/Icon';
import {ProductCardSkeleton} from '~/components/ui/Skeleton';
import {
  MOCK_CATEGORIES,
  MOCK_BESTSELLERS,
  MOCK_NEW_ARRIVALS,
  MOCK_TESTIMONIALS,
  MOCK_PRESS,
} from '~/lib/mock';

export const meta: Route.MetaFunction = () => [
  {title: 'Avestam — Handcrafted Ethnic Wear'},
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
  };

  const transformedProducts = products.nodes.map(transformProduct);
  const bestsellers = transformedProducts.slice(0, 6);
  const newArrivals = transformedProducts.slice(6, 12);

  return {
    categories: MOCK_CATEGORIES,
    bestsellers,
    newArrivals,
    testimonials: MOCK_TESTIMONIALS,
    press: MOCK_PRESS,
  };
}

export default function Homepage() {
  const {categories, bestsellers, newArrivals, testimonials, press} =
    useLoaderData<typeof loader>();

  return (
    <div className="av-home">
      <HeroBanner />
      <CategoryGrid categories={categories} />
      <BrandStrip />
      <Carousel title="Bestsellers" viewAllUrl="/collections/bestsellers">
        {bestsellers.map((p, i) => (
          <div key={p.id} className="av-carousel__item">
            <ProductCard product={p} loading={i < 3 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </Carousel>
      <EditorialBanner
        tag="New Collection"
        headline="The Festive Edit"
        sub="Handcrafted for the moments that matter."
        cta="Explore Now"
        ctaUrl="/collections/lehenga"
        imageSeed={400}
        align="left"
      />
      <Carousel title="New Arrivals" viewAllUrl="/collections/new-arrivals">
        {newArrivals.map((p) => (
          <div key={p.id} className="av-carousel__item">
            <ProductCard product={p} />
          </div>
        ))}
      </Carousel>
      <TrustBar />
      <TestimonialsSection testimonials={testimonials} />
      <PressSection press={press} />
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
          src="https://picsum.photos/seed/avhero/1600/900"
          alt="Avestam — The Festive Edit"
          className="av-hero__img"
          loading="eager"
          fetchPriority="high"
        />
        <div className="av-hero__overlay" />
      </div>

      {/* Content */}
      <div className="av-hero__content">
        <p className="av-hero__eyebrow">New Collection</p>
        <h1 className="av-hero__headline">The Festive Edit</h1>
        <p className="av-hero__sub">
          Handcrafted for the moments that matter.
        </p>
        <Link to="/collections/bridal-festive" className="btn btn-secondary btn-lg av-hero__cta">
          Shop Now
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="av-hero__scroll" aria-hidden="true">
        <Icon name="chevron-down" size={20} strokeWidth={1} />
      </div>
    </section>
  );
}

// ─── Category Grid ────────────────────────────────────────────────

function CategoryGrid({categories}: {categories: typeof MOCK_CATEGORIES}) {
  return (
    <section className="av-categories section">
      <div className="container">
        <div className="av-categories__grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/collections/${cat.handle}`}
              prefetch="intent"
              className="av-cat-card"
            >
              <div className="av-cat-card__img-wrap">
                <img
                  src={cat.image.url}
                  alt={cat.image.altText}
                  loading="lazy"
                  className="av-cat-card__img"
                />
              </div>
              <p className="av-cat-card__title">{cat.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Brand Strip ──────────────────────────────────────────────────

function BrandStrip() {
  return (
    <div className="av-brand-strip">
      <div className="container">
        <p className="av-brand-strip__text">
          ♥ &nbsp; Handcrafted by 5,000+ artisans across India
        </p>
      </div>
    </div>
  );
}

// ─── Editorial Banner ─────────────────────────────────────────────

type EditorialBannerProps = {
  tag: string;
  headline: string;
  sub: string;
  cta: string;
  ctaUrl: string;
  imageSeed: number;
  align: 'left' | 'right';
};

function EditorialBanner({tag, headline, sub, cta, ctaUrl, imageSeed, align}: EditorialBannerProps) {
  return (
    <section className={`av-editorial section av-editorial--${align}`}>
      <div className="container">
        <div className="av-editorial__inner">
          <div className="av-editorial__image-wrap">
            <img
              src={`https://picsum.photos/seed/aved${imageSeed}/900/600`}
              alt={headline}
              loading="lazy"
              className="av-editorial__img"
            />
          </div>
          <div className="av-editorial__content">
            <p className="av-editorial__tag">{tag}</p>
            <h2 className="av-editorial__headline">{headline}</h2>
            <p className="av-editorial__sub">{sub}</p>
            <Link to={ctaUrl} className="btn btn-primary btn-lg">
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {icon: 'truck'    as const, title: 'Free Shipping',    sub: 'On orders above ₹1,999'},
  {icon: 'star'     as const, title: 'Premium Quality',  sub: 'Handcrafted by artisans'},
  {icon: 'heart'    as const, title: 'Easy Returns',     sub: '7-day hassle-free returns'},
  {icon: 'user'     as const, title: 'Cash on Delivery', sub: 'Available across India'},
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

// ─── Press Section ────────────────────────────────────────────────

function PressSection({press}: {press: typeof MOCK_PRESS}) {
  return (
    <section className="av-press section">
      <div className="container">
        <p className="av-press__label">As Featured In</p>
        <div className="av-press__logos">
          {press.map((p) => (
            <div key={p.id} className="av-press__logo">
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
