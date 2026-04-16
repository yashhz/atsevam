import {Icon} from '~/components/ui/Icon';

export const meta = () => [
  {title: 'Contact Us — Avestam'},
  {name: 'description', content: 'Get in touch with Avestam for any questions, concerns, or feedback.'},
];

export default function Contact() {
  return (
    <div className="av-contact-page">
      <div className="container">
        <header className="av-contact-page__header">
          <h1 className="av-contact-page__title">Get in Touch</h1>
          <p className="av-contact-page__subtitle">
            We'd love to hear from you. Our team is here to help.
          </p>
        </header>

        <div className="av-contact-page__grid">
          {/* Contact Form */}
          <div className="av-contact-page__form-section">
            <h2 className="av-contact-page__section-title">Send us a message</h2>
            <form className="av-contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="av-contact-form__row">
                <div className="av-contact-form__field">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required />
                </div>
                <div className="av-contact-form__field">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required />
                </div>
              </div>
              <div className="av-contact-form__field">
                <label htmlFor="phone">Phone (optional)</label>
                <input type="tel" id="phone" name="phone" />
              </div>
              <div className="av-contact-form__field">
                <label htmlFor="subject">Subject</label>
                <select id="subject" name="subject" required>
                  <option value="">Select a topic</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Question</option>
                  <option value="return">Returns & Exchanges</option>
                  <option value="wholesale">Wholesale / B2B</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="av-contact-form__field">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={6} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="av-contact-page__info-section">
            <h2 className="av-contact-page__section-title">Other ways to reach us</h2>
            
            <div className="av-contact-info">
              <div className="av-contact-info__item">
                <div className="av-contact-info__icon">
                  <Icon name="mail" size={20} />
                </div>
                <div>
                  <p className="av-contact-info__label">Email</p>
                  <a href="mailto:support@avestam.com" className="av-contact-info__value">
                    support@avestam.com
                  </a>
                </div>
              </div>

              <div className="av-contact-info__item">
                <div className="av-contact-info__icon">
                  <Icon name="phone" size={20} />
                </div>
                <div>
                  <p className="av-contact-info__label">Phone</p>
                  <a href="tel:+911234567890" className="av-contact-info__value">
                    +91 123 456 7890
                  </a>
                  <p className="av-contact-info__note">Mon-Sat, 10 AM - 6 PM IST</p>
                </div>
              </div>

              <div className="av-contact-info__item">
                <div className="av-contact-info__icon">
                  <Icon name="instagram" size={20} />
                </div>
                <div>
                  <p className="av-contact-info__label">Instagram</p>
                  <a href="https://instagram.com/atsevaam" target="_blank" rel="noopener noreferrer" className="av-contact-info__value">
                    @atsevaam
                  </a>
                </div>
              </div>

              <div className="av-contact-info__item">
                <div className="av-contact-info__icon">
                  <Icon name="map-pin" size={20} />
                </div>
                <div>
                  <p className="av-contact-info__label">Address</p>
                  <p className="av-contact-info__value">
                    123 Fashion Street<br />
                    Mumbai, Maharashtra 400001<br />
                    India
                  </p>
                </div>
              </div>
            </div>

            <div className="av-contact-page__hours">
              <h3>Business Hours</h3>
              <p>Monday - Saturday: 10:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
