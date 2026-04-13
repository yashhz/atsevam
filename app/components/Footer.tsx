import {Suspense} from 'react';
import {Await, NavLink, Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

const FOOTER_LINKS = {
  'Customer Service': [
    {title: 'Track Order',         url: '/pages/track-order'},
    {title: 'Returns & Exchanges', url: '/policies/refund-policy'},
    {title: 'Shipping Policy',     url: '/policies/shipping-policy'},
    {title: 'FAQ',                 url: '/pages/faq'},
    {title: 'Contact Us',          url: '/pages/contact'},
  ],
  'Quick Links': [
    {title: 'Our Story',           url: '/pages/our-story'},
    {title: 'Wholesale / B2B',     url: '/pages/wholesale'},
    {title: 'Size Guide',          url: '/pages/size-guide'},
    {title: 'Privacy Policy',      url: '/policies/privacy-policy'},
    {title: 'Terms of Service',    url: '/policies/terms-of-service'},
  ],
  'Shop': [
    {title: 'Lehengas',            url: '/collections/lehenga'},
    {title: 'Anarkalis',           url: '/collections/anarkalis'},
    {title: 'Kurtis',              url: '/collections/kurtis'},
    {title: 'Co-ord Sets',         url: '/collections/co-ords'},
    {title: 'New Arrivals',        url: '/collections/new-arrivals'},
  ],
};

const SOCIAL_LINKS = [
  {name: 'Instagram', url: 'https://instagram.com', icon: 'IG'},
  {name: 'Pinterest', url: 'https://pinterest.com', icon: 'PT'},
  {name: 'Facebook',  url: 'https://facebook.com',  icon: 'FB'},
  {name: 'YouTube',   url: 'https://youtube.com',   icon: 'YT'},
];

export function Footer({footer: footerPromise, header, publicStoreDomain}: FooterProps) {
  return (
    <footer className="av-footer">
      {/* Main footer grid */}
      <div className="av-footer__main">
        <div className="container">
          <div className="av-footer__grid">

            {/* Brand column */}
            <div className="av-footer__brand">
              <p className="av-footer__logo">AVESTAM</p>
              <p className="av-footer__tagline">
                Handcrafted ethnic wear celebrating India's artisanal heritage.
              </p>
              <div className="av-footer__social">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="av-footer__social-link"
                    aria-label={s.name}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading} className="av-footer__col">
                <p className="av-footer__col-heading">{heading}</p>
                <ul className="av-footer__col-list">
                  {links.map((link) => (
                    <li key={link.url}>
                      <NavLink to={link.url} className="av-footer__link">
                        {link.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter column */}
            <div className="av-footer__newsletter">
              <p className="av-footer__col-heading">Newsletter</p>
              <p className="av-footer__newsletter-text">
                New arrivals, exclusive offers, and styling inspiration — straight to your inbox.
              </p>
              <form className="av-footer__newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email address"
                  className="av-footer__newsletter-input"
                  aria-label="Email address"
                />
                <button type="submit" className="btn btn-primary">
                  Subscribe
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="av-footer__bottom">
        <div className="container">
          <div className="av-footer__bottom-inner">
            <p className="av-footer__copyright">
              © {new Date().getFullYear()} Avestam. All rights reserved.
            </p>
            <p className="av-footer__made-with">
              Crafted with love ♥
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
