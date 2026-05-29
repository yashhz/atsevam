import {NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {Icon} from '~/components/ui/Icon';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

const FOOTER_LINKS = {
  'Customer Service': [
    {title: 'Track Order',         url: '/pages/track-order',         icon: 'package' as const},
    {title: 'FAQ',                 url: '/pages/faq',                 icon: 'help-circle' as const},
    {title: 'Contact Us',          url: '/pages/contact',             icon: 'mail' as const},
  ],
  'Quick Links': [
    {title: 'Our Story',           url: '/pages/our-story',           icon: 'heart' as const},
    {title: 'Wholesale / B2B',     url: '/pages/wholesale',           icon: 'briefcase' as const},
    {title: 'Size Guide',          url: '/pages/size-guide',          icon: 'ruler' as const},
  ],
  'Shop': [
    {title: 'Lehengas',            url: '/collections/lehengas',      icon: 'star' as const},
    {title: 'Anarkalis',           url: '/collections/anarkali',      icon: 'star' as const},
    {title: 'Kurtis',              url: '/collections/kurtis',        icon: 'star' as const},
    {title: 'Co-ord Sets',         url: '/collections/co-ords',       icon: 'star' as const},
    {title: 'New Arrivals',        url: '/collections/new-arrivals',  icon: 'sparkles' as const},
  ],
};

const SOCIAL_LINKS = [
  {name: 'Instagram', url: 'https://instagram.com/atsevaam', icon: 'instagram'},
  {name: 'Facebook',  url: 'https://www.facebook.com/atsevaam',  icon: 'facebook'},
  {name: 'YouTube',   url: 'https://www.youtube.com/@atsevam1',   icon: 'youtube'},
];

export function Footer({footer: footerPromise, header, publicStoreDomain}: FooterProps) {
  return (
    <footer className="av-footer">
      {/* Main footer grid */}
      <div className="av-footer__main">
        <div className="container">
          <div className="av-footer__grid">

            {/* Brand column - wider */}
            <div className="av-footer__brand av-footer__brand--wide">
              <img 
                src="/images/logo.svg" 
                alt="Atsevam" 
                className="av-footer__logo-img"
                width="150"
                height="45"
              />
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
                    <Icon name={s.icon as any} size={20} strokeWidth={1.5} />
                  </a>
                ))}
              </div>
              <p className="av-footer__contact-info">
                <strong>Email:</strong> <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a>
              </p>
              <p className="av-footer__contact-info">
                <strong>Phone:</strong> <a href="tel:+919979905952">+91 99799 05952</a>
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading} className="av-footer__col">
                <p className="av-footer__col-heading">{heading}</p>
                <ul className="av-footer__col-list">
                  {links.map((link) => (
                    <li key={link.url}>
                      <NavLink to={link.url} className="av-footer__link">
                        <Icon name={link.icon} size={16} strokeWidth={1.5} />
                        <span>{link.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="av-footer__bottom">
        <div className="container">
          {/* Trust badges */}
          <div className="av-footer__trust-badges">
            <div className="av-footer__trust-badge">
              <Icon name="shield" size={20} strokeWidth={1.5} />
              <span>Secure Payment</span>
            </div>
            <div className="av-footer__trust-badge">
              <Icon name="truck" size={20} strokeWidth={1.5} />
              <span>Fast Delivery</span>
            </div>
            <div className="av-footer__trust-badge">
              <Icon name="check-circle" size={20} strokeWidth={1.5} />
              <span>Quality Assured</span>
            </div>
            <div className="av-footer__trust-badge">
              <Icon name="heart" size={20} strokeWidth={1.5} />
              <span>Made with Love</span>
            </div>
          </div>
          
          <div className="av-footer__bottom-inner">
            <p className="av-footer__copyright">
              © {new Date().getFullYear()} Atsevam. All rights reserved.
            </p>
            <p className="av-footer__made-with">
              Crafted with love ♥
            </p>
          </div>
        </div>
      </div>

      {/* Category Sub-Footer (Reveals categories bar on hover) */}
      <div className="av-footer__categories-bar">
        <div className="container">
          <div className="av-footer__categories-inner">
            <NavLink to="/collections/sarees" className="av-footer__category-tab-link">Saree</NavLink>
            <NavLink to="/collections/blouse" className="av-footer__category-tab-link">Blouse</NavLink>
            <NavLink to="/collections/western-dresses" className="av-footer__category-tab-link">Women</NavLink>
            <NavLink to="/collections/lehengas" className="av-footer__category-tab-link">Heartwork</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
