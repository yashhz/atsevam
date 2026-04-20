import type {Route} from './+types/pages.wholesale';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'Wholesale & B2B — Atsevam'},
  {name: 'description', content: 'Partner with Atsevam for wholesale ethnic wear. Special pricing for boutiques, retailers, and bulk orders.'},
];

const BENEFITS = [
  {
    icon: 'tag' as const,
    title: 'Competitive Pricing',
    text: 'Get special wholesale rates with volume discounts. The more you order, the more you save.',
  },
  {
    icon: 'truck' as const,
    title: 'Reliable Delivery',
    text: 'Dedicated logistics support with tracking. Bulk orders delivered within 10-15 business days.',
  },
  {
    icon: 'star' as const,
    title: 'Quality Assurance',
    text: 'Every piece is quality-checked before dispatch. We stand behind our craftsmanship.',
  },
  {
    icon: 'user' as const,
    title: 'Dedicated Support',
    text: 'Personal account manager to help with orders, inventory planning, and product selection.',
  },
];

const PRICING_TIERS = [
  {tier: '10-49 pieces', discount: '15% off retail'},
  {tier: '50-99 pieces', discount: '20% off retail'},
  {tier: '100+ pieces', discount: '25% off retail'},
  {tier: 'Custom orders', discount: 'Contact for quote'},
];

export default function Wholesale() {
  return (
    <div className="av-wholesale-page">
      {/* Hero */}
      <section className="av-wholesale-page__hero">
        <div className="container">
          <div className="av-wholesale-page__hero-content">
            <h1 className="av-wholesale-page__title">Wholesale & B2B</h1>
            <p className="av-wholesale-page__subtitle">
              Partner with Atsevam to bring handcrafted ethnic wear to your customers
            </p>
          </div>
        </div>
      </section>

      <div className="container container--narrow">
        {/* Intro */}
        <section className="av-wholesale-page__intro">
          <p className="av-wholesale-page__lead">
            We work with boutiques, retailers, and fashion entrepreneurs across India to bring our handcrafted collections to more women.
          </p>
          <p>
            Whether you're a brick-and-mortar store, an online retailer, or planning a pop-up, we offer flexible wholesale programs with competitive pricing, reliable delivery, and dedicated support.
          </p>
        </section>

        {/* Benefits */}
        <section className="av-wholesale-page__benefits">
          <h2 className="av-wholesale-page__section-title">Why Partner with Atsevam?</h2>
          <div className="av-wholesale-page__benefits-grid">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="av-wholesale-page__benefit">
                <div className="av-wholesale-page__benefit-icon">
                  <Icon name={benefit.icon} size={24} />
                </div>
                <h3 className="av-wholesale-page__benefit-title">{benefit.title}</h3>
                <p className="av-wholesale-page__benefit-text">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="av-wholesale-page__pricing">
          <h2 className="av-wholesale-page__section-title">Wholesale Pricing</h2>
          <div className="av-wholesale-page__pricing-table">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.tier} className="av-wholesale-page__pricing-row">
                <span className="av-wholesale-page__pricing-tier">{tier.tier}</span>
                <span className="av-wholesale-page__pricing-discount">{tier.discount}</span>
              </div>
            ))}
          </div>
          <p className="av-wholesale-page__pricing-note">
            Prices exclude GST and shipping. Minimum order quantity: 10 pieces.
          </p>
        </section>

        {/* How it Works */}
        <section className="av-wholesale-page__process">
          <h2 className="av-wholesale-page__section-title">How It Works</h2>
          <div className="av-wholesale-page__steps">
            <div className="av-wholesale-page__step">
              <div className="av-wholesale-page__step-number">1</div>
              <h3>Submit Inquiry</h3>
              <p>Fill out the form below with your business details and requirements.</p>
            </div>
            <div className="av-wholesale-page__step">
              <div className="av-wholesale-page__step-number">2</div>
              <h3>Get Quote</h3>
              <p>Our team will review and send you a customized quote within 24-48 hours.</p>
            </div>
            <div className="av-wholesale-page__step">
              <div className="av-wholesale-page__step-number">3</div>
              <h3>Place Order</h3>
              <p>Approve the quote and place your order. We accept bank transfer and credit terms for established partners.</p>
            </div>
            <div className="av-wholesale-page__step">
              <div className="av-wholesale-page__step-number">4</div>
              <h3>Receive & Sell</h3>
              <p>Your order ships within 10-15 days with full tracking and quality assurance.</p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="av-wholesale-page__form-section">
          <h2 className="av-wholesale-page__section-title">Get Started</h2>
          <p className="av-wholesale-page__form-intro">
            Interested in wholesale partnership? Email us at <a href="mailto:wholesale@atsevam.com">wholesale@atsevam.com</a> with your business details and requirements.
          </p>
          <p className="av-wholesale-page__note">
            We'll respond within 24-48 hours with pricing information and next steps.
          </p>
        </section>

        {/* Contact Info */}
        <section className="av-wholesale-page__contact">
          <h2 className="av-wholesale-page__section-title">Get in Touch</h2>
          <p>Ready to partner with us? Contact our wholesale team:</p>
          <p>
            <strong>Email:</strong> <a href="mailto:wholesale@atsevam.com">wholesale@atsevam.com</a>
          </p>
          <p className="av-wholesale-page__note">
            We'll respond within 24-48 hours with pricing information and next steps.
          </p>
        </section>
      </div>
    </div>
  );
}
