import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

/**
 * The main cart component — used both in /cart page and cart Aside drawer.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const cartHasItems = Boolean(cart?.totalQuantity && cart.totalQuantity > 0);
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  if (!cartHasItems) {
    return <CartEmpty layout={layout} />;
  }

  return (
    <div className={`av-cart av-cart--${layout}`}>
      {/* Line items */}
      <ul className="av-cart__lines" aria-label="Cart items">
        {(cart?.lines?.nodes ?? []).map((line) => {
          if ('parentRelationship' in line && line.parentRelationship?.parent) {
            return null;
          }
          return (
            <CartLineItem
              key={line.id}
              line={line}
              layout={layout}
              childrenMap={childrenMap}
            />
          );
        })}
      </ul>

      {/* Summary / checkout */}
      <CartSummary cart={cart} layout={layout} />
    </div>
  );
}

function CartEmpty({layout}: {layout: CartLayout}) {
  const {close} = useAside();
  return (
    <div className="av-cart-empty">
      <div className="av-cart-empty__icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>
      <h2 className="av-cart-empty__title">Your cart is empty</h2>
      <p className="av-cart-empty__sub">
        Looks like you haven&rsquo;t added anything yet.
      </p>
      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="btn btn-primary"
      >
        Start Shopping
      </Link>
    </div>
  );
}

