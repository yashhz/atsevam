import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  return (
    <li key={id} className="av-cart-line">
      {/* Product Image */}
      {image && (
        <Link
          to={lineItemUrl}
          prefetch="intent"
          onClick={() => layout === 'aside' && close()}
          className="av-cart-line__img-link"
        >
          <Image
            alt={title}
            aspectRatio="4/5"
            data={image}
            height={110}
            width={88}
            loading="lazy"
            className="av-cart-line__img"
          />
        </Link>
      )}

      {/* Info */}
      <div className="av-cart-line__info">
        {/* Title */}
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => layout === 'aside' && close()}
          className="av-cart-line__title-link"
        >
          <p className="av-cart-line__title">{product.title}</p>
        </Link>

        {/* Selected options (Size, Color) */}
        {selectedOptions.filter(o => o.value !== 'Default Title').length > 0 && (
          <div className="av-cart-line__options">
            {selectedOptions
              .filter(o => o.value !== 'Default Title')
              .map(option => (
                <span key={option.name} className="av-cart-line__option">
                  {option.name}: {option.value}
                </span>
              ))}
          </div>
        )}

        {/* Price */}
        <div className="av-cart-line__price">
          <ProductPrice price={line?.cost?.totalAmount} />
        </div>

        {/* Quantity controls + Remove */}
        <CartLineQuantity line={line} />
      </div>

      {/* Child line items (bundles etc.) */}
      {lineItemChildren && (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Items included with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="av-cart-line__children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="av-cart-line__qty-row">
      {/* Stepper */}
      <div className="av-cart-qty">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            className="av-cart-qty__btn"
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
          >
            −
          </button>
        </CartLineUpdateButton>

        <span className="av-cart-qty__value">{quantity}</span>

        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            className="av-cart-qty__btn"
            aria-label="Increase quantity"
            disabled={!!isOptimistic}
          >
            +
          </button>
        </CartLineUpdateButton>
      </div>

      {/* Remove */}
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        disabled={disabled}
        type="submit"
        className="av-cart-line__remove"
        aria-label="Remove item"
      >
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
