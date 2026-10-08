import {useEffect, useState} from 'react';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

type StickyBuyBarProps = {
  title: string;
  price: string;
  compareAtPrice?: string;
  discount?: number;
  /** Selected variant label, e.g. "M" — shown so the buyer knows what they're adding */
  variantLabel?: string;
  variantId?: string;
  available: boolean;
  /** Element whose visibility controls the bar: shown once it has scrolled out of view */
  sentinelSelector: string;
  lines: Parameters<typeof AddToCartButton>[0]['lines'];
};

/**
 * Mobile-only buy bar. The real Add to Cart button lives far down the page on
 * a phone; once it scrolls out of view this keeps price + CTA a thumb away.
 */
export function StickyBuyBar({
  title,
  price,
  compareAtPrice,
  discount,
  variantLabel,
  available,
  sentinelSelector,
  lines,
}: StickyBuyBarProps) {
  const {open} = useAside();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(sentinelSelector);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show only after the button has gone off the TOP of the screen
        // (scrolled past it), not while it is still below the fold.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {threshold: 0},
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [sentinelSelector]);

  return (
    <div
      className={`av-pdp-sticky${visible ? ' av-pdp-sticky--visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="av-pdp-sticky__info">
        <span className="av-pdp-sticky__title">{title}</span>
        <span className="av-pdp-sticky__price-row">
          <span className="av-pdp-sticky__price">{price}</span>
          {compareAtPrice && (
            <span className="av-pdp-sticky__compare">{compareAtPrice}</span>
          )}
          {discount ? (
            <span className="av-pdp-sticky__discount">{discount}% OFF</span>
          ) : null}
          {variantLabel && (
            <span className="av-pdp-sticky__variant">· {variantLabel}</span>
          )}
        </span>
      </div>
      <AddToCartButton
        disabled={!available || !lines.length}
        onClick={() => open('cart')}
        lines={lines}
        className="av-pdp-sticky__btn"
      >
        {available ? 'Add to Cart' : 'Sold Out'}
      </AddToCartButton>
    </div>
  );
}
