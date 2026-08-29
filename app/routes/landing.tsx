import {Link} from 'react-router';
import type {Route} from './+types/landing';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'Atsevam | Premium Festive & Wedding Collection'},
  {name: 'description', content: 'Explore exclusive deals on Lehengas, Anarkali Suits, Kurtis, Co-ord Sets, Sarees & Western Wear at Atsevam. Made in India with free prepaid shipping.'},
];

export default function LandingPage() {
  return (
    <div className="av-landing-page">
      {/* Hero Header */}
      <section className="av-landing-hero">
        <div className="av-landing-hero__content container">
          <span className="av-landing-hero__badge">FESTIVE &amp; WEDDING SPECIAL</span>
          <h1 className="av-landing-hero__title">Timeless Craftsmanship, Contemporary Grace</h1>
          <p className="av-landing-hero__subtitle">
            Handcrafted Lehengas, Designer Anarkalis, Everyday Kurtis &amp; Western Silhouettes with Free Prepaid Shipping across India.
          </p>
          <div className="av-landing-hero__actions">
            <Link to="/collections/all" className="btn btn-primary btn-lg">
              Explore Collection →
            </Link>
            <Link to="/collections/all?discount=35" className="btn btn-secondary btn-lg">
              Up to 60% OFF Deals
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="av-landing-highlights section container">
        <div className="av-landing-grid">
          <Link to="/collections/lehengas" className="av-landing-card">
            <img src="/images/lehenga.jpg" alt="Lehengas" className="av-landing-card__img" />
            <div className="av-landing-card__info">
              <h2>Bridal &amp; Festive Lehengas</h2>
              <span>Shop Collection →</span>
            </div>
          </Link>
          <Link to="/collections/anarkali" className="av-landing-card">
            <img src="/images/anarkali.jpg" alt="Anarkalis" className="av-landing-card__img" />
            <div className="av-landing-card__info">
              <h2>Royal Anarkali Suits</h2>
              <span>Shop Collection →</span>
            </div>
          </Link>
          <Link to="/collections/kurtis" className="av-landing-card">
            <img src="/images/kurti.jpg" alt="Kurtis" className="av-landing-card__img" />
            <div className="av-landing-card__info">
              <h2>Everyday &amp; Festive Kurtis</h2>
              <span>Shop Collection →</span>
            </div>
          </Link>
          <Link to="/collections/co-ords" className="av-landing-card">
            <img src="/images/coord.jpg" alt="Co-ords" className="av-landing-card__img" />
            <div className="av-landing-card__info">
              <h2>Modern Co-ord Sets</h2>
              <span>Shop Collection →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Trust & Promises */}
      <section className="av-landing-trust section">
        <div className="container">
          <div className="av-trust-grid">
            <div className="av-trust-item">
              <Icon name="truck" size={32} />
              <h3>Free Shipping</h3>
              <p>On all prepaid orders across India</p>
            </div>
            <div className="av-trust-item">
              <Icon name="shield" size={32} />
              <h3>100% Authentic Quality</h3>
              <p>Handcrafted by 5,000+ skilled artisans</p>
            </div>
            <div className="av-trust-item">
              <Icon name="refresh-cw" size={32} />
              <h3>Easy Returns</h3>
              <p>Hassle-free return policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
