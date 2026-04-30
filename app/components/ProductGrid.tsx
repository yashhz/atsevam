/**
 * ATSEVAM — Reusable ProductGrid Component
 *
 * Usage:
 *   <ProductGrid
 *     title="New Arrivals"
 *     subtitle="Just landed — the freshest pieces from our artisans"
 *     products={newArrivals}
 *     viewAllHref="/collections/new-arrivals"
 *     loading="lazy"
 *   />
 */

import {Link} from 'react-router';
import {ProductCard} from '~/components/ProductCard';
import type {MockProduct} from '~/lib/mock';

type ProductGridProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  products: MockProduct[];
  viewAllHref?: string;
  viewAllLabel?: string;
  loading?: 'eager' | 'lazy';
  /** Optional column override – defaults to responsive 2→4 col grid */
  columns?: 2 | 3 | 4;
};

export function ProductGrid({
  title,
  subtitle,
  eyebrow,
  products,
  viewAllHref,
  viewAllLabel = 'View All',
  loading = 'lazy',
  columns = 4,
}: ProductGridProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="av-product-grid-section">
      {/* Header */}
      <div className="av-product-grid-section__header container">
        {eyebrow && (
          <p className="av-product-grid-section__eyebrow">{eyebrow}</p>
        )}
        <div className="av-product-grid-section__title-row">
          <h2 className="av-product-grid-section__title">{title}</h2>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="av-product-grid-section__view-all"
              prefetch="intent"
            >
              {viewAllLabel}
              <span className="av-product-grid-section__view-all-arrow" aria-hidden>→</span>
            </Link>
          )}
        </div>
        {subtitle && (
          <p className="av-product-grid-section__subtitle">{subtitle}</p>
        )}
      </div>

      {/* Grid */}
      <div className={`av-product-grid container av-product-grid--cols-${columns}`}>
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={i < 4 ? 'eager' : loading}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton loader shown while products are being fetched (Suspense fallback).
 */
export function ProductGridSkeleton({
  count = 4,
  columns = 4,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  return (
    <section className="av-product-grid-section">
      <div className="av-product-grid-section__header container">
        <div className="av-skeleton av-skeleton--title" />
        <div className="av-skeleton av-skeleton--subtitle" />
      </div>
      <div className={`av-product-grid container av-product-grid--cols-${columns}`}>
        {Array.from({length: count}).map((_, i) => (
          <div key={i} className="av-card-skeleton">
            <div className="av-card-skeleton__image av-skeleton" />
            <div className="av-card-skeleton__body">
              <div className="av-skeleton av-skeleton--text" />
              <div className="av-skeleton av-skeleton--text av-skeleton--short" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
