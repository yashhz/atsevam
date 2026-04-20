import {Icon} from '~/components/ui/Icon';
import {useState} from 'react';

export const meta = () => [
  {title: 'Contact Us — Atsevam'},
  {name: 'description', content: 'Get in touch with Atsevam for any questions, concerns, or feedback.'},
];

// WhatsApp number for contact form
const WHATSAPP_NUMBER = '919979905952'; // Format: country code + number (no + or spaces)

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build WhatsApp message
    const whatsappMessage = `
*New Contact Form Inquiry*

*Name:* ${formData.name}
*Phone:* ${formData.phone}
*Subject:* ${formData.subject}

*Message:*
${formData.message}
    `.trim();

    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Open WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
            <p className="av-contact-page__form-note">
              Fill out the form below and we'll connect with you on WhatsApp
            </p>
            <form className="av-contact-form" onSubmit={handleSubmit}>
              <div className="av-contact-form__row">
                <div className="av-contact-form__field">
                  <label htmlFor="name">Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="av-contact-form__field">
                  <label htmlFor="phone">Phone *</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 99799 05952"
                  />
                </div>
              </div>
              <div className="av-contact-form__field">
                <label htmlFor="subject">Subject *</label>
                <select 
                  id="subject" 
                  name="subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="Order Inquiry">Order Inquiry</option>
                  <option value="Product Question">Product Question</option>
                  <option value="Returns & Exchanges">Returns & Exchanges</option>
                  <option value="Wholesale / B2B">Wholesale / B2B</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="av-contact-form__field">
                <label htmlFor="message">Message *</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={6} 
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                <Icon name="phone" size={18} strokeWidth={2} />
                Send via WhatsApp
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
                  <a href="mailto:atsevam1@gmail.com" className="av-contact-info__value">
                    atsevam1@gmail.com
                  </a>
                  <p className="av-contact-info__note">We respond within 24 hours</p>
                </div>
              </div>

              <div className="av-contact-info__item">
                <div className="av-contact-info__icon">
                  <Icon name="phone" size={20} />
                </div>
                <div>
                  <p className="av-contact-info__label">Phone</p>
                  <a href="tel:+919979905952" className="av-contact-info__value">
                    +91 99799 05952
                  </a>
                  <p className="av-contact-info__note">Mon-Sat, 10 AM - 7 PM IST</p>
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
                    Atsevam Fashion<br />
                    The Polaris Textile City<br />
                    39-46, Parvat Gam, Shakti Nagar<br />
                    Surat, Gujarat 395012<br />
                    India
                  </p>
                  <a 
                    href="https://maps.app.goo.gl/m7PHpKAGLjuQneMD6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="av-contact-info__link"
                  >
                    View on Google Maps →
                  </a>
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
