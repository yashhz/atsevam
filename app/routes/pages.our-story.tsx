import type {Route} from './+types/pages.our-story';
import {Link} from 'react-router';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'Our Story — Atsevam'},
  {name: 'description', content: 'The story behind Atsevam — handcrafted ethnic wear celebrating India\'s artisanal heritage.'},
];

const VALUES = [
  {
    icon: 'heart' as const,
    title: 'Handcrafted with Love',
    text: 'Every piece is made by skilled artisans who have inherited their craft across generations. No two pieces are exactly alike.',
  },
  {
    icon: 'star' as const,
    title: 'Uncompromising Quality',
    text: 'We source only the finest fabrics — premium nets, silks, and georgettes — and pair them with meticulous embroidery work.',
  },
  {
    icon: 'truck' as const,
    title: 'Thoughtful Delivery',
    text: 'Each order is carefully packaged and delivered within 5–7 days. We treat every parcel like a gift.',
  },
  {
    icon: 'user' as const,
    title: 'Made for Every Woman',
    text: 'From intimate mehendi ceremonies to grand receptions, our designs celebrate every occasion and every body.',
  },
];

const MILESTONES = [
  {year: '2018', text: 'Atsevam was founded with a single lehenga design and a dream to bring artisanal ethnic wear to modern women.'},
  {year: '2019', text: 'Expanded to Anarkalis and Kurtis. Partnered with 50+ artisan families across Rajasthan and Gujarat.'},
  {year: '2021', text: 'Launched our Co-ord Sets line, bridging traditional craft with contemporary silhouettes.'},
  {year: '2023', text: 'Crossed 10,000 happy customers. Featured in Vogue India, Femina, and Harper\'s Bazaar.'},
  {year: '2024', text: 'Introduced our B2B wholesale program, empowering boutiques across India to carry Atsevam.'},
  {year: 'Now',  text: 'A growing family of 5,000+ artisans, 4 collections, and a commitment to keeping craft alive.'},
];

export default function OurStory() {
  return (
    <div className="av-story">

      {/* Hero */}
      <section className="av-story__hero">
        <div className="av-story__hero-bg">
          <img
            src="/images/story-model.png"
            alt="Beautiful handcrafted bridal couture"
            className="av-story__hero-img"
            loading="eager"
          />
          <div className="av-story__hero-overlay" />
        </div>
        <div className="av-story__hero-content container">
          <p className="av-story__eyebrow">Our Heritage</p>
          <h1 className="av-story__headline">Where Craft Meets Couture</h1>
        </div>
      </section>

      {/* Opening statement */}
      <section className="av-story__opening section">
        <div className="container container--narrow">
          <p className="av-story__lead">
            Atsevam was born from a simple belief — that the most beautiful things in the world are made by human hands.
          </p>
          <p className="av-story__body av-story__body--dropcap">
            Made in Surat by skilled karigars, every piece tells a story of dedication and artistry. In a world of fast fashion and mass production, we chose a different path. We went to the villages of Rajasthan, the workshops of Gujarat, and the ateliers of Lucknow — and we listened. We listened to artisans who had spent decades perfecting the art of zari embroidery, thread chain stitch, and block printing. We heard their stories, learned their techniques, and made a promise: to give their craft the audience it deserves.
          </p>
          <p className="av-story__body">
            Today, Atsevam is more than a clothing brand. It is a bridge between the hands that create and the women who wear — a celebration of India's living textile heritage, reimagined for the modern wardrobe.
          </p>
          
          <div className="av-story__divider">
            <div className="av-story__divider-line" />
            <div className="av-story__divider-dot" />
            <div className="av-story__divider-line" />
          </div>
        </div>
      </section>

      {/* Split image + text */}
      <section className="av-story__split section">
        <div className="container">
          <div className="av-story__split-inner">
            <div className="av-story__split-image">
              <img src="/images/story-artisan.png" alt="Karigar meticulously embroidering luxury fabric" loading="lazy" />
            </div>
            <div className="av-story__split-content">
              <p className="av-story__section-tag">The Craft</p>
              <h2 className="av-story__section-title">Every Thread Tells a Story</h2>
              <p className="av-story__body">
                A single Atsevam lehenga can take up to 45 days to complete. The embroidery alone — intricate zari work, heavy thread chain stitch, or delicate sequin placement — is done entirely by hand, stitch by stitch, by artisans who have trained for years.
              </p>
              <p className="av-story__body">
                We work directly with artisan cooperatives, ensuring fair wages, safe working conditions, and the preservation of techniques that might otherwise be lost to time.
              </p>
              <Link to="/collections/lehengas" className="btn btn-primary">
                Shop Lehengas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section className="av-story__values section">
        <div className="container">
          <h2 className="section-heading">What We Stand For</h2>
          <div className="av-story__values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="av-story__value-card">
                <div className="av-story__value-icon">
                  <Icon name={v.icon} size={22} strokeWidth={1.25} />
                </div>
                <h3 className="av-story__value-title">{v.title}</h3>
                <p className="av-story__value-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="av-story__timeline section">
        <div className="container container--narrow">
          <h2 className="section-heading">Our Journey</h2>
          <div className="av-story__timeline-list">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="av-story__milestone">
                <div className="av-story__milestone-year">{m.year}</div>
                <div className="av-story__milestone-line">
                  <div className="av-story__milestone-dot" />
                  {i < MILESTONES.length - 1 && <div className="av-story__milestone-track" />}
                </div>
                <p className="av-story__milestone-text">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Second split — reversed */}
      <section className="av-story__split av-story__split--reverse section">
        <div className="container">
          <div className="av-story__split-inner">
            <div className="av-story__split-image">
              <img src="/images/story-detail.png" alt="Macro detail of luxury zari gold embroidery" loading="lazy" />
            </div>
            <div className="av-story__split-content">
              <p className="av-story__section-tag">The Detail</p>
              <h2 className="av-story__section-title">Designed for Real Life</h2>
              <p className="av-story__body">
                Our collections span the full spectrum of a woman's life — from the grandeur of a bridal lehenga to the ease of an everyday kurti. We believe that beautiful clothing shouldn't be reserved for special occasions alone.
              </p>
              <p className="av-story__body">
                Every silhouette is designed with comfort in mind. Our fabrics breathe, our cuts flatter, and our sizing is inclusive — because every woman deserves to feel extraordinary.
              </p>
              <Link to="/collections/kurtis" className="btn btn-secondary">
                Explore Kurtis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="av-story__cta-banner">
        <div className="container">
          <div className="av-story__cta-inner">
            <p className="av-story__cta-tag">Join the Family</p>
            <h2 className="av-story__cta-title">Wear the Art. Support the Artisan.</h2>
            <p className="av-story__cta-sub">
              Every purchase directly supports the artisan families who made it.
            </p>
            <div className="av-story__cta-btns">
              <Link to="/collections/lehengas" className="btn btn-primary btn-lg">
                Shop Now
              </Link>
              <Link to="/pages/wholesale" className="btn btn-secondary btn-lg">
                B2B Enquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
