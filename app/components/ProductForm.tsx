import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();

  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div className="av-product-form">
      {/* ── Variant selectors ──────────────────────────────────── */}
      {productOptions.map((option) => {
        return (
          <div className="av-product-form__option-group" key={option.name}>
            <div className="av-product-form__option-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
              <h5 className="av-product-form__option-label" style={{margin: 0}}>{option.name}</h5>
              {(option.name.toLowerCase().includes('size') || option.name.toLowerCase().includes('sizing')) && (
                <a href="/pages/size-guide" className="av-pdp__size-guide" style={{fontSize: 'var(--text-xs)', color: 'var(--color-brand)', textDecoration: 'underline', fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-medium)'}}>
                  Size Guide
                </a>
              )}
            </div>
            <div className="av-product-form__option-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  return (
                    <Link
                      className={`av-product-form__option-btn${selected ? ' av-product-form__option-btn--active' : ''}${!available ? ' av-product-form__option-btn--unavailable' : ''}`}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`av-product-form__option-btn${selected ? ' av-product-form__option-btn--active' : ''}${!available ? ' av-product-form__option-btn--unavailable' : ''}`}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}

      {/* ── Add to Cart ─────────────────────────────────────────── */}
      <div className="av-product-form__actions">
        <AddToCartButton
          disabled={!selectedVariant || !isAvailable}
          onClick={() => open('cart')}
          lines={
            selectedVariant
              ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
              : []
          }
          className="btn btn-primary btn-full btn-lg"
        >
          {isAvailable ? 'Add to Cart' : 'Sold Out'}
        </AddToCartButton>

        {/* ── Buy Now (direct to checkout) ──────────────────────── */}
        {isAvailable && selectedVariant && (
          <a
            href={`https://checkout.shopify.com/cart/${selectedVariant.id.split('/').pop()}:1`}
            className="btn btn-ghost btn-full btn-lg av-product-form__buy-now"
            onClick={(e) => {
              // Use cart checkout URL if available via data attribute,
              // otherwise fall back to standard Shopify checkout
              const checkoutUrl = document.querySelector<HTMLElement>('[data-checkout-url]')
                ?.dataset.checkoutUrl;
              if (checkoutUrl) {
                e.preventDefault();
                // Add current variant to cart then redirect
                // Simplest approach: navigate to checkout URL
                window.location.href = checkoutUrl;
              }
            }}
          >
            Buy Now
          </a>
        )}
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return <>{name}</>;

  return (
    <div
      aria-label={name}
      className="av-product-form__swatch"
      style={{backgroundColor: color || 'transparent'}}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}
