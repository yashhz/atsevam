import {Link} from 'react-router';
import {useState} from 'react';
import {Icon} from '~/components/ui/Icon';
import {Badge} from '~/components/ui/Badge';
import type {MockProduct} from '~/lib/mock';

type ProductCardProps = {
  product: MockProduct;
  loading?: 'eager' | 'lazy';
};

export function ProductCard({product, loading = 'lazy'}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const hasMultipleImages = !!product.hoverImage;
  const showSecondImage = (hovered || activeImageIndex === 1) && hasMultipleImages;

  const handleImageTap = (e: React.MouseEvent) => {
    // Only toggle on mobile/tablet (touch devices)
    if (window.innerWidth <= 1024 && hasMultipleImages) {
      e.preventDefault();
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }
  };

  return (
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

        {/* Badge */}
        {product.badge && (
          <div className="av-card__badge">
            <Badge variant={product.badge} />
          </div>
        )}

        {/* Image indicators */}
        {hasMultipleImages && (
          <div className="av-card__indicators">
            <span className={`av-card__indicator-dot${activeImageIndex === 0 ? ' active' : ''}`} />
            <span className={`av-card__indicator-dot${activeImageIndex === 1 ? ' active' : ''}`} />
          </div>
        )}

        {/* Wishlist */}
        <button
          className={`wishlist-btn av-card__wishlist${wishlisted ? ' active' : ''}`}
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
      </Link>

      {/* Info */}
      <div className="av-card__info">
        {/* Category pill */}
        <span className="av-card__category">{product.category}</span>

        {/* Title */}
        <Link to={`/products/${product.handle}`} prefetch="intent" className="av-card__title-link">
          <h3 className="av-card__title truncate-2">{product.title}</h3>
        </Link>

        {/* Price row */}
        <div className="av-card__price-row">
          <span className="av-card__price">{product.price}</span>
          {product.compareAtPrice && (
            <span className="av-card__compare">{product.compareAtPrice}</span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="star-rating">
            <Icon name="star-filled" size={12} strokeWidth={0} />
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="star-rating__count">({product.reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
