import {Link} from 'react-router';
import {useState, useEffect, useCallback} from 'react';
import {Icon} from '~/components/ui/Icon';
import {Badge} from '~/components/ui/Badge';
import type {MockProduct} from '~/lib/mock';

type ProductCardProps = {
  product: MockProduct;
  loading?: 'eager' | 'lazy';
};

// ─── Quick View Modal ─────────────────────────────────────────────

function QuickViewModal({
  product,
  onClose,
}: {
  product: MockProduct;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="av-quick-view-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${product.title}`}
    >
      <div
        className="av-quick-view"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="av-quick-view__close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          <Icon name="close" size={20} strokeWidth={1.5} />
        </button>

        {/* Image */}
        <div className="av-quick-view__img-wrap">
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText}
            className="av-quick-view__img"
            loading="eager"
          />
          {product.badge && (
            <div className="av-quick-view__badge">
              <Badge variant={product.badge} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="av-quick-view__info">
          <span className="av-quick-view__category">{product.category}</span>
          <h3 className="av-quick-view__title">{product.title}</h3>

          {/* Rating */}
          {product.rating && product.rating > 0 && (
            <div className="av-quick-view__rating">
              <span className="av-quick-view__rating-badge">
                {product.rating.toFixed(1)}
                <Icon name="star-filled" size={10} strokeWidth={0} />
              </span>
              {product.reviewCount && (
                <span className="av-quick-view__rating-count">
                  ({product.reviewCount} reviews)
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="av-quick-view__price-row">
            <span className="av-quick-view__price">{product.price}</span>
            {product.compareAtPrice && (
              <>
                <span className="av-quick-view__compare">{product.compareAtPrice}</span>
                {product.discount && (
                  <span className="av-quick-view__discount">{product.discount}% OFF</span>
                )}
              </>
            )}
          </div>
          <p className="av-quick-view__tax-note">MRP inclusive of all taxes</p>

          {/* CTA */}
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            className="btn btn-primary btn-full btn-lg av-quick-view__cta"
          >
            View Full Details
          </Link>
          <p className="av-quick-view__hint">
            Select size &amp; add to cart on product page
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────

export function ProductCard({product, loading = 'lazy'}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const hasMultipleImages = !!product.hoverImage;
  const showSecondImage = (hovered || activeImageIndex === 1) && hasMultipleImages;

  const handleImageTap = (e: React.MouseEvent) => {
    if (window.innerWidth <= 1024 && hasMultipleImages) {
      e.preventDefault();
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }
  };

  const openQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewOpen(false);
  }, []);

  return (
    <>
      <div
        className={`av-card${hasMultipleImages ? ' has-multiple-images' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image container */}
        <Link
          to={`/products/${product.handle}`}
          prefetch="intent"
          className="av-card__image-wrap"
          onClick={handleImageTap}
        >
          {/* Primary image */}
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText}
            loading={loading}
            className={`av-card__img av-card__img--primary${showSecondImage ? ' av-card__img--hidden' : ''}`}
          />
          {/* Hover image */}
          {product.hoverImage && (
            <img
              src={product.hoverImage.url}
              alt={product.hoverImage.altText}
              loading="lazy"
              className={`av-card__img av-card__img--hover${showSecondImage ? ' av-card__img--visible' : ''}`}
            />
          )}

          {/* Badges Stack */}
          <div className="av-card__badges-stack">
            {product.discount && product.discount > 0 ? (
              <Badge variant="sale" label={`${product.discount}% OFF`} />
            ) : null}
            {(product.badge === 'new' || product.tags?.includes('new')) && (
              <Badge variant="new" label="NEW ARRIVAL" />
            )}
            {(product.badge === 'bestseller' || product.tags?.includes('bestseller')) && (
              <Badge variant="bestseller" label="BESTSELLER" />
            )}
            {/* Fallback for other single badges */}
            {product.badge && 
             product.badge !== 'new' && 
             product.badge !== 'bestseller' && 
             !(product.discount && product.discount > 0) && (
              <Badge variant={product.badge} />
            )}
          </div>

          {/* Image indicators */}
          {hasMultipleImages && (
            <div className="av-card__indicators">
              <span className={`av-card__indicator-dot${activeImageIndex === 0 ? ' active' : ''}`} />
              <span className={`av-card__indicator-dot${activeImageIndex === 1 ? ' active' : ''}`} />
            </div>
          )}

          {/* Wishlist */}
          <button
            className={`av-card__wishlist${wishlisted ? ' active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWishlisted((v) => !v);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Icon
              name={wishlisted ? 'heart-filled' : 'heart'}
              size={16}
              strokeWidth={1.5}
            />
          </button>

          {/* Quick View bar — slides up on hover */}
          <div className="av-card__quick-view">
            <button
              className="av-card__quick-view-btn"
              onClick={openQuickView}
              aria-label={`Quick view ${product.title}`}
            >
              Quick View
            </button>
          </div>
        </Link>

        {/* Info */}
        <div className="av-card__info">
          {/* Brand / Category */}
          <span className="av-card__brand">{product.category}</span>

          {/* Title */}
          <Link to={`/products/${product.handle}`} prefetch="intent" className="av-card__title-link">
            <p className="av-card__title">{product.title}</p>
          </Link>

          {/* Price row — Myntra style: price + strikethrough + discount% */}
          <div className="av-card__price-row">
            <span className="av-card__price">{product.price}</span>
            {product.compareAtPrice && (
              <>
                <span className="av-card__mrp">{product.compareAtPrice}</span>
                {product.discount && (
                  <span className="av-card__discount">({product.discount}% OFF)</span>
                )}
              </>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="av-card__rating">
              <span className="av-card__rating-badge">
                {product.rating.toFixed(1)}
                <Icon name="star-filled" size={10} strokeWidth={0} />
              </span>
              {product.reviewCount && (
                <span className="av-card__rating-count">({product.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal — rendered inline, visually portaled via fixed positioning */}
      {quickViewOpen && (
        <QuickViewModal product={product} onClose={closeQuickView} />
      )}
    </>
  );
}
