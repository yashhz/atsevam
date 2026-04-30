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

// ─── Navigation Structure ────────────────────────────────────────

// Main header - simple navigation
const MAIN_NAV = [
  {title: 'Home',       url: '/'},
  {title: 'Contact',    url: '/pages/contact'},
];

// Category groups with their subcategories
const CATEGORY_GROUPS = {
  'ethnic': {
    title: 'Ethnic Wear',
    items: [
      {title: 'Lehengas',   url: '/collections/lehengas'},
      {title: 'Anarkalis',  url: '/collections/anarkali'},
      {title: 'Kurtis',     url: '/collections/kurtis'},
      {title: 'Co-ords',    url: '/collections/co-ords'},
    ],
  },
  'western': {
    title: 'Western Wear',
    items: [
      {title: 'Dresses',         url: '/collections/western-dresses'},
      {title: 'Tops & Tunics',   url: '/collections/western-tops-tunics'},
      {title: 'Pants & Skirts',  url: '/collections/western-pants-skirts'},
      {title: 'Swimwear',        url: '/collections/western-swimwear'},
    ],
  },
  'navratri': {
    title: 'Navratri Collection',
    items: [
      {title: 'Lehenga Choli',  url: '/collections/navratri-lehenga-choli'},
      {title: 'Kurtis',         url: '/collections/navratri-kurtis'},
      {title: 'Chaniya Choli',  url: '/collections/navratri-chaniya-choli'},
    ],
  },
  'sarees': {
    title: 'Sarees',
    items: [
      {title: 'Sarees',  url: '/collections/sarees'},
    ],
  },
};

// Default category tabs (shown on homepage and non-category pages)
const DEFAULT_CATEGORY_TABS = [
  {title: 'Lehengas',           url: '/collections/lehengas',                  group: 'ethnic'},
  {title: 'Anarkalis',          url: '/collections/anarkali',                  group: 'ethnic'},
  {title: 'Kurtis',             url: '/collections/kurtis',                    group: 'ethnic'},
  {title: 'Co-ords',            url: '/collections/co-ords',                   group: 'ethnic'},
  {title: 'Sarees',             url: '/collections/sarees',                    group: 'sarees'},
  {title: 'Western Wear',       url: '/collections/western-dresses',           group: 'western'},
  {title: 'Navratri',           url: '/collections/navratri-lehenga-choli',    group: 'navratri'},
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
            <img 
              src="/images/logo.svg" 
              alt="Atsevam" 
              className="av-header__logo-img"
              width="150"
              height="45"
            />
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
  // Use MAIN_NAV for simple navigation
  const items = MAIN_NAV;

  return (
    <nav className="av-nav" aria-label="Main navigation">
      {items.map((item, i) => (
        <NavLink
          key={i}
          to={item.url}
          prefetch="intent"
          end={item.url === '/'}
          className={({isActive}) =>
            `av-nav__item${isActive ? ' av-nav__item--active' : ''}`
          }
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

// ─── Category Tab Bar ─────────────────────────────────────────────

function CategoryTabBar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="av-tabs" role="navigation" aria-label="Category tabs">
      <div className="av-tabs__inner">
        {/* Ethnic Wear - Direct Links */}
        <NavLink
          to="/collections/lehengas"
          prefetch="intent"
          className={({isActive}) =>
            `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
          }
        >
          Lehengas
        </NavLink>
        <NavLink
          to="/collections/anarkali"
          prefetch="intent"
          className={({isActive}) =>
            `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
          }
        >
          Anarkalis
        </NavLink>
        <NavLink
          to="/collections/kurtis"
          prefetch="intent"
          className={({isActive}) =>
            `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
          }
        >
          Kurtis
        </NavLink>
        <NavLink
          to="/collections/co-ords"
          prefetch="intent"
          className={({isActive}) =>
            `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
          }
        >
          Co-ords
        </NavLink>

        {/* Sarees - Direct Link */}
        <NavLink
          to="/collections/sarees"
          prefetch="intent"
          className={({isActive}) =>
            `av-tabs__item${isActive ? ' av-tabs__item--active' : ''}`
          }
        >
          Sarees
        </NavLink>

        {/* Western Wear - Dropdown */}
        <div 
          className="av-tabs__dropdown"
          onMouseEnter={() => setOpenDropdown('western')}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button className="av-tabs__item av-tabs__item--dropdown">
            Western Wear
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          {openDropdown === 'western' && (
            <div className="av-tabs__dropdown-menu">
              {CATEGORY_GROUPS.western.items.map((item, i) => (
                <NavLink
                  key={i}
                  to={item.url}
                  prefetch="intent"
                  className="av-tabs__dropdown-item"
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Navratri - Dropdown */}
        <div 
          className="av-tabs__dropdown"
          onMouseEnter={() => setOpenDropdown('navratri')}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button className="av-tabs__item av-tabs__item--dropdown">
            Navratri
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          {openDropdown === 'navratri' && (
            <div className="av-tabs__dropdown-menu">
              {CATEGORY_GROUPS.navratri.items.map((item, i) => (
                <NavLink
                  key={i}
                  to={item.url}
                  prefetch="intent"
                  className="av-tabs__dropdown-item"
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          )}
        </div>
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
    <NavLink
      to="/account"
      prefetch="intent"
      className="av-header__icon-btn av-header__account-btn"
      aria-label="Account"
    >
      <Suspense
        fallback={
          <span className="av-header__account-icon">
            <Icon name="user" size={20} strokeWidth={1.5} />
          </span>
        }
      >
        <Await resolve={isLoggedIn}>
          {(loggedIn) => (
            <span className="av-header__account-icon">
              <Icon
                name="user"
                size={20}
                strokeWidth={loggedIn ? 1 : 1.5}
              />
              {loggedIn && (
                <span
                  className="av-header__account-dot"
                  aria-label="Signed in"
                />
              )}
            </span>
          )}
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroup(expandedGroup === groupKey ? null : groupKey);
  };

  return (
    <nav className="av-mobile-menu" aria-label="Mobile navigation">
      <NavLink to="/" prefetch="intent" onClick={close} className="av-mobile-menu__item" end>
        Home
      </NavLink>

      {/* Category Groups */}
      {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
        <div key={key}>
          <button
            className="av-mobile-menu__group-btn"
            onClick={() => toggleGroup(key)}
          >
            <span>{group.title}</span>
            <Icon 
              name="chevron-down" 
              size={16} 
              strokeWidth={2}
              className={expandedGroup === key ? 'rotate-180' : ''}
            />
          </button>
          {expandedGroup === key && (
            <div className="av-mobile-menu__submenu">
              {group.items.map((item, i) => (
                <NavLink
                  key={i}
                  to={item.url}
                  prefetch="intent"
                  onClick={close}
                  className={({isActive}) =>
                    `av-mobile-menu__subitem${isActive ? ' av-mobile-menu__subitem--active' : ''}`
                  }
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="av-mobile-menu__divider" />

      <NavLink to="/pages/contact" onClick={close} className="av-mobile-menu__item">
        Contact
      </NavLink>
      <NavLink to="/account" onClick={close} className="av-mobile-menu__item">
        Account / Sign In
      </NavLink>
      <NavLink to="/search" onClick={close} className="av-mobile-menu__item">
        Search
      </NavLink>
    </nav>
  );
}

// Keep old export name for backward compat with PageLayout
export {MobileMenu as HeaderMenu};
