import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Icon} from '~/components/ui/Icon';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

// ─── Atsevam nav — women's wear only, 4 categories + brand story
const NAV_ITEMS = [
  {title: 'Lehengas',    url: '/collections/lehengas'},
  {title: 'Anarkalis',   url: '/collections/anarkali'},
  {title: 'Kurtis',      url: '/collections/kurtis'},
  {title: 'Co-ords',     url: '/collections/co-ords'},
  {title: 'Our Story',   url: '/pages/our-story'},
];

// Secondary tab bar — quick-access filters
const CATEGORY_TABS = [
  {title: 'Lehengas',  url: '/collections/lehengas'},
  {title: 'Anarkalis', url: '/collections/anarkali'},
  {title: 'Kurtis',    url: '/collections/kurtis'},
  {title: 'Co-ords',   url: '/collections/co-ords'},
];

// ─── Main Header ─────────────────────────────────────────────────

export function Header({header, isLoggedIn, cart, publicStoreDomain}: HeaderProps) {
  const {shop, menu} = header;

  return (
    <>
      {/* Announcement bar */}
      <AnnouncementBar />

      {/* Main header */}
      <header className="av-header">
        <div className="av-header__inner">
          {/* Mobile menu toggle */}
          <MobileMenuToggle />

          {/* Logo */}
          <NavLink to="/" prefetch="intent" className="av-header__logo" end>
            <span className="av-header__logo-text">ATSEVAM</span>
          </NavLink>

          {/* Desktop nav */}
          <DesktopNav
            menu={menu}
            primaryDomainUrl={shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />

          {/* Right icons */}
          <div className="av-header__actions">
            <SearchToggle />
            <AccountLink isLoggedIn={isLoggedIn} />
            <CartToggle cart={cart} />
          </div>
        </div>
      </header>

      {/* Category tab bar */}
      <CategoryTabBar />
    </>
  );
}

// ─── Announcement Bar ─────────────────────────────────────────────

function AnnouncementBar() {
  return (
    <div className="av-announcement">
      <p className="av-announcement__text">
        Free shipping on orders above ₹1,999 &nbsp;·&nbsp; Easy returns &nbsp;·&nbsp; Cash on delivery available
      </p>
    </div>
  );
}

// ─── Desktop Nav ─────────────────────────────────────────────────

function DesktopNav({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const items = menu?.items?.length ? menu.items : NAV_ITEMS.map((n, i) => ({
    id: String(i),
    url: n.url,
    title: n.title,
    resourceId: null,
    tags: [],
    type: 'HTTP' as const,
    items: [],
  }));

  return (
    <nav className="av-nav" aria-label="Main navigation">
      {items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            key={item.id}
            to={url}
            prefetch="intent"
            className={({isActive}) =>
              `av-nav__item${isActive ? ' av-nav__item--active' : ''}`
            }
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

// ─── Category Tab Bar ─────────────────────────────────────────────

function CategoryTabBar() {
  return (
    <div className="av-tabs" role="navigation" aria-label="Category tabs">
      <div className="av-tabs__inner">
        {CATEGORY_TABS.map((tab) => (
          <NavLink
            key={tab.url}
            to={tab.url}
            prefetch="intent"
            className={({isActive}) =>
              `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
            }
          >
            {tab.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Menu Toggle ───────────────────────────────────────────

function MobileMenuToggle() {
  const {open} = useAside();
  return (
    <button
      className="av-header__mobile-toggle"
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <Icon name="menu" size={22} strokeWidth={1.5} />
    </button>
  );
}

// ─── Search Toggle ────────────────────────────────────────────────

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="av-header__icon-btn"
      onClick={() => open('search')}
      aria-label="Search"
    >
      <Icon name="search" size={20} strokeWidth={1.5} />
    </button>
  );
}

// ─── Account Link ─────────────────────────────────────────────────

function AccountLink({isLoggedIn}: {isLoggedIn: Promise<boolean>}) {
  return (
    <NavLink to="/account" prefetch="intent" className="av-header__icon-btn" aria-label="Account">
      <Suspense fallback={<Icon name="user" size={20} strokeWidth={1.5} />}>
        <Await resolve={isLoggedIn}>
          {() => <Icon name="user" size={20} strokeWidth={1.5} />}
        </Await>
      </Suspense>
    </NavLink>
  );
}

// ─── Cart Toggle ──────────────────────────────────────────────────

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartIcon count={0} />}>
      <Await resolve={cart}>
        <CartIconBanner />
      </Await>
    </Suspense>
  );
}

function CartIconBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartIcon count={cart?.totalQuantity ?? 0} />;
}

function CartIcon({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      className="av-header__icon-btn av-header__cart-btn"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      aria-label={`Cart, ${count} items`}
    >
      <Icon name="cart" size={20} strokeWidth={1.5} />
      {count > 0 && (
        <span className="av-header__cart-count" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Mobile Menu (used in PageLayout) ────────────────────────────

export function MobileMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const {close} = useAside();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const items = menu?.items?.length ? menu.items : NAV_ITEMS.map((n, i) => ({
    id: String(i),
    url: n.url,
    title: n.title,
    resourceId: null,
    tags: [],
    type: 'HTTP' as const,
    items: [],
  }));

  return (
    <nav className="av-mobile-menu" aria-label="Mobile navigation">
      <NavLink to="/" prefetch="intent" onClick={close} className="av-mobile-menu__item" end>
        Home
      </NavLink>

      {items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <NavLink
            key={item.id}
            to={url}
            prefetch="intent"
            onClick={close}
            className={({isActive}) =>
              `av-mobile-menu__item${isActive ? ' av-mobile-menu__item--active' : ''}`
            }
          >
            {item.title}
          </NavLink>
        );
      })}

      <div className="av-mobile-menu__divider" />

      <NavLink to="/account" onClick={close} className="av-mobile-menu__item">
        Account
      </NavLink>
      <NavLink to="/search" onClick={close} className="av-mobile-menu__item">
        Search
      </NavLink>
    </nav>
  );
}

// Keep old export name for backward compat with PageLayout
export {MobileMenu as HeaderMenu};
