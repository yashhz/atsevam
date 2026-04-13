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

  return (
    <div
      className="av-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <Link to={`/products/${product.handle}`} prefetch="intent" className="av-card__image-wrap">
        {/* Primary image */}
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText}
          loading={loading}
          className={`av-card__img av-card__img--primary${hovered && product.hoverImage ? ' av-card__img--hidden' : ''}`}
        />
        {/* Hover image */}
        {product.hoverImage && (
          <img
            src={product.hoverImage.url}
            alt={product.hoverImage.altText}
            loading="lazy"
            className={`av-card__img av-card__img--hover${hovered ? ' av-card__img--visible' : ''}`}
          />
        )}

        {/* Badge */}
        {product.badge && (
          <div className="av-card__badge">
            <Badge variant={product.badge} />
          </div>
        )}

        {/* Wishlist */}
        <button
          className={`wishlist-btn av-card__wishlist${wishlisted ? ' active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
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
