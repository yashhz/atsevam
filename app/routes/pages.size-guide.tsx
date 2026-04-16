import type {Route} from './+types/pages.size-guide';

export const meta: Route.MetaFunction = () => [
  {title: 'Size Guide — Avestam'},
  {name: 'description', content: 'Find your perfect fit with our detailed size guide for lehengas, anarkalis, kurtis, and co-ord sets.'},
];

const SIZE_CHARTS = {
  lehenga: [
    {size: 'S', bust: '32-34', waist: '26-28', hip: '34-36', length: '42'},
    {size: 'M', bust: '34-36', waist: '28-30', hip: '36-38', length: '42'},
    {size: 'L', bust: '36-38', waist: '30-32', hip: '38-40', length: '42'},
    {size: 'XL', bust: '38-40', waist: '32-34', hip: '40-42', length: '42'},
    {size: 'XXL', bust: '40-42', waist: '34-36', hip: '42-44', length: '42'},
  ],
  kurti: [
    {size: 'S', bust: '36', waist: '34', hip: '38', length: '45-48'},
    {size: 'M', bust: '38', waist: '36', hip: '40', length: '45-48'},
    {size: 'L', bust: '40', waist: '38', hip: '42', length: '45-48'},
    {size: 'XL', bust: '42', waist: '40', hip: '44', length: '45-48'},
    {size: 'XXL', bust: '44', waist: '42', hip: '46', length: '45-48'},
  ],
  coord: [
    {size: 'M', bust: '38', waist: '30-32', hip: '40', topLength: 'Varies'},
    {size: 'L', bust: '40', waist: '32-34', hip: '42', topLength: 'Varies'},
    {size: 'XL', bust: '42', waist: '34-36', hip: '44', topLength: 'Varies'},
    {size: 'XXL', bust: '44', waist: '36-38', hip: '46', topLength: 'Varies'},
  ],
};

export default function SizeGuide() {
  return (
    <div className="av-size-guide-page">
      <div className="container container--narrow">
        <header className="av-size-guide-page__header">
          <h1 className="av-size-guide-page__title">Size Guide</h1>
          <p className="av-size-guide-page__subtitle">
            Find your perfect fit with our detailed measurements
          </p>
        </header>

        {/* How to Measure */}
        <section className="av-size-guide__section">
          <h2 className="av-size-guide__section-title">How to Measure</h2>
          <div className="av-size-guide__measure-grid">
            <div className="av-size-guide__measure-item">
              <h3>Bust</h3>
              <p>Measure around the fullest part of your bust, keeping the tape parallel to the floor.</p>
            </div>
            <div className="av-size-guide__measure-item">
              <h3>Waist</h3>
              <p>Measure around your natural waistline, keeping the tape comfortably loose.</p>
            </div>
            <div className="av-size-guide__measure-item">
              <h3>Hip</h3>
              <p>Measure around the fullest part of your hips, about 8 inches below your waist.</p>
            </div>
            <div className="av-size-guide__measure-item">
              <h3>Length</h3>
              <p>Measure from the shoulder seam to the desired hem length.</p>
            </div>
          </div>
        </section>

        {/* Lehenga Size Chart */}
        <section className="av-size-guide__section">
          <h2 className="av-size-guide__section-title">Lehenga & Anarkali</h2>
          <div className="av-size-guide__table-wrapper">
            <table className="av-size-guide__table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (inches)</th>
                  <th>Waist (inches)</th>
                  <th>Hip (inches)</th>
                  <th>Length (inches)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHARTS.lehenga.map((row) => (
                  <tr key={row.size}>
                    <td><strong>{row.size}</strong></td>
                    <td>{row.bust}</td>
                    <td>{row.waist}</td>
                    <td>{row.hip}</td>
                    <td>{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="av-size-guide__note">
            Note: Anarkalis are semi-stitched and come in Free Size with adjustable waist.
          </p>
        </section>

        {/* Kurti Size Chart */}
        <section className="av-size-guide__section">
          <h2 className="av-size-guide__section-title">Kurtis</h2>
          <div className="av-size-guide__table-wrapper">
            <table className="av-size-guide__table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (inches)</th>
                  <th>Waist (inches)</th>
                  <th>Hip (inches)</th>
                  <th>Length (inches)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHARTS.kurti.map((row) => (
                  <tr key={row.size}>
                    <td><strong>{row.size}</strong></td>
                    <td>{row.bust}</td>
                    <td>{row.waist}</td>
                    <td>{row.hip}</td>
                    <td>{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Co-ord Size Chart */}
        <section className="av-size-guide__section">
          <h2 className="av-size-guide__section-title">Co-ord Sets</h2>
          <div className="av-size-guide__table-wrapper">
            <table className="av-size-guide__table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (inches)</th>
                  <th>Waist (inches)</th>
                  <th>Hip (inches)</th>
                  <th>Top Length</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHARTS.coord.map((row) => (
                  <tr key={row.size}>
                    <td><strong>{row.size}</strong></td>
                    <td>{row.bust}</td>
                    <td>{row.waist}</td>
                    <td>{row.hip}</td>
                    <td>{row.topLength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="av-size-guide__note">
            Note: Co-ord sets feature elastic waistbands for flexible fit.
          </p>
        </section>

        {/* Tips */}
        <section className="av-size-guide__section">
          <h2 className="av-size-guide__section-title">Sizing Tips</h2>
          <ul className="av-size-guide__tips">
            <li>If you're between sizes, we recommend sizing up for a comfortable fit.</li>
            <li>All measurements are in inches and approximate. Slight variations may occur due to handcrafted nature.</li>
            <li>For custom sizing or alterations, contact us at support@avestam.com</li>
            <li>Check individual product pages for specific measurements and fit notes.</li>
          </ul>
        </section>

        <div className="av-size-guide-page__cta">
          <p>Need help finding your size?</p>
          <a href="/pages/contact" className="btn btn-primary">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
