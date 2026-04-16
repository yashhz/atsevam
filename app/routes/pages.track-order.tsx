import type {Route} from './+types/pages.track-order';
import {useState} from 'react';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'Track Order — Avestam'},
  {name: 'description', content: 'Track your Avestam order status and delivery information.'},
];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);
    // In production, this would call an API to fetch tracking info
    setTimeout(() => {
      setIsTracking(false);
      alert('Tracking functionality will be connected to your order management system.');
    }, 1000);
  };

  return (
    <div className="av-track-order-page">
      <div className="container container--narrow">
        <header className="av-track-order-page__header">
          <div className="av-track-order-page__icon">
            <Icon name="package" size={48} strokeWidth={1.5} />
          </div>
          <h1 className="av-track-order-page__title">Track Your Order</h1>
          <p className="av-track-order-page__subtitle">
            Enter your order details to see the latest status
          </p>
        </header>

        <form className="av-track-order-form" onSubmit={handleSubmit}>
          <div className="av-track-order-form__field">
            <label htmlFor="order-number">Order Number *</label>
            <input
              type="text"
              id="order-number"
              name="orderNumber"
              placeholder="e.g., #AV12345"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
            <p className="av-track-order-form__help">
              You can find this in your order confirmation email
            </p>
          </div>

          <div className="av-track-order-form__field">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isTracking}
          >
            {isTracking ? 'Tracking...' : 'Track Order'}
          </button>
        </form>

        <div className="av-track-order-page__divider">
          <span>or</span>
        </div>

        <div className="av-track-order-page__alt-methods">
          <h2 className="av-track-order-page__section-title">Other Ways to Track</h2>
          
          <div className="av-track-order-page__method">
            <div className="av-track-order-page__method-icon">
              <Icon name="user" size={24} />
            </div>
            <div>
              <h3>Check Your Account</h3>
              <p>View all your orders and tracking information in one place</p>
              <a href="/account/orders" className="av-track-order-page__link">
                Go to My Orders →
              </a>
            </div>
          </div>

          <div className="av-track-order-page__method">
            <div className="av-track-order-page__method-icon">
              <Icon name="mail" size={24} />
            </div>
            <div>
              <h3>Check Your Email</h3>
              <p>We sent a tracking link when your order shipped</p>
              <p className="av-track-order-page__note">
                Look for an email from support@avestam.com
              </p>
            </div>
          </div>

          <div className="av-track-order-page__method">
            <div className="av-track-order-page__method-icon">
              <Icon name="phone" size={24} />
            </div>
            <div>
              <h3>Contact Support</h3>
              <p>Our team is here to help with any order questions</p>
              <a href="/pages/contact" className="av-track-order-page__link">
                Contact Us →
              </a>
            </div>
          </div>
        </div>

        <div className="av-track-order-page__faq">
          <h2 className="av-track-order-page__section-title">Common Questions</h2>
          <div className="av-track-order-page__faq-list">
            <div className="av-track-order-page__faq-item">
              <h3>When will I receive tracking information?</h3>
              <p>You'll receive a tracking number via email and SMS within 24 hours of your order being shipped.</p>
            </div>
            <div className="av-track-order-page__faq-item">
              <h3>How long does delivery take?</h3>
              <p>Standard delivery takes 5-7 business days across India. You can track your order in real-time once it ships.</p>
            </div>
            <div className="av-track-order-page__faq-item">
              <h3>My tracking hasn't updated in days</h3>
              <p>Sometimes tracking can have delays during transit. If it's been more than 3 days without an update, please contact us.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
