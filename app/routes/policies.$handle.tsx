import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';

const LOCAL_POLICIES: Record<string, {title: string; body: string}> = {
  'shipping-policy': {
    title: 'Shipping & Delivery Policy',
    body: `
      <h2>Shipping Destinations</h2>
      <ul>
        <li>We currently ship across India only.</li>
        <li>International shipping is not available at this time.</li>
      </ul>

      <h2>Order Processing & Dispatch</h2>
      <ul>
        <li>All orders are dispatched on the same day if placed before the cut-off time.</li>
        <li>Orders placed on Sundays or public holidays will be dispatched the next working day.</li>
      </ul>

      <h2>Delivery Timeline</h2>
      <ul>
        <li>Estimated delivery: 5–7 business days across India.</li>
        <li>Timelines are provided by our courier partners and may vary based on your location.</li>
      </ul>

      <h2>Shipping Charges</h2>
      <ul>
        <li>Free shipping on all prepaid orders.</li>
        <li>Shipping charges may apply for other payment modes — final charges will be displayed at checkout.</li>
      </ul>

      <h2>Order Tracking</h2>
      <ul>
        <li>Once your order is dispatched, you will receive a tracking number via Email and SMS.</li>
        <li>You can track your order using the link provided or from your account dashboard.</li>
      </ul>

      <h2>Courier Partners</h2>
      <p>We partner with leading courier services including Delhivery, Bluedart, and other trusted logistics providers to ensure safe and timely delivery.</p>

      <h2>Damaged or Tampered Shipments</h2>
      <ul>
        <li>If your order arrives damaged or tampered, do not accept the delivery.</li>
        <li>Record an unboxing video and take photos immediately.</li>
        <li>Email us at <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a> or call <strong>+91 99799 05952</strong> with your order number, photos, and video within 48 hours of delivery.</li>
        <li>We will resolve the issue at the earliest and coordinate with the courier partner.</li>
      </ul>

      <h2>Wrong Address & Failed Delivery</h2>
      <ul>
        <li>Please ensure your shipping address is accurate and complete at checkout.</li>
        <li>Atsevam is not responsible for delays or non-delivery due to incorrect address provided by the customer.</li>
        <li>Re-delivery charges may apply in case of failed delivery attempts.</li>
      </ul>
    `
  },
  'refund-policy': {
    title: 'Return & Exchange Policy',
    body: `
      <h2>Return Window</h2>
      <ul>
        <li>Returns and exchanges are accepted within 48 hours of delivery.</li>
        <li>Requests raised after 48 hours of delivery will not be accepted under any circumstances.</li>
      </ul>

      <h2>Eligible Conditions for Return / Exchange</h2>
      <ul>
        <li>Damaged product received.</li>
        <li>Wrong product delivered.</li>
        <li>Quality issue with the product.</li>
      </ul>
      <p><strong>Note:</strong> Items must be unworn, unwashed, and in original condition with tags attached. Used or washed items will not be accepted for return or exchange.</p>

      <h2>How to Initiate a Return / Exchange</h2>
      <ul>
        <li>Email us at <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a> or call <strong>+91 99799 05952</strong> within 48 hours of receiving your order.</li>
        <li>Share your order number, photos/video of the issue.</li>
        <li>Our team will review and respond within 24–48 hours.</li>
        <li>If approved, pickup will be arranged within 2–3 business days.</li>
      </ul>

      <h2>Exchange</h2>
      <ul>
        <li>Exchange is available for a different size or color of the same product, subject to availability.</li>
        <li>Replacement will be shipped once we receive and inspect the original item.</li>
      </ul>

      <h2>Refund</h2>
      <ul>
        <li>Refunds will be processed to your original payment method (bank account / UPI) within 5–7 business days after we receive and inspect the returned item.</li>
        <li>Shipping charges are non-refundable.</li>
      </ul>

      <h2>Non-Returnable Items</h2>
      <ul>
        <li>Items purchased on sale or with discount codes are final sale and non-returnable.</li>
        <li>Customized or bulk orders are not eligible for return or exchange.</li>
      </ul>
    `
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    body: `
      <p>Atsevam (a retail brand of Warthy Ent, Wing B, Shop No 39-46, The Polaris Textile City, Godadra Road, Magob Road, Shakti Nagar, Surat, Gujarat – 395010) is committed to protecting your privacy.</p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Name, email address, phone number, and shipping address when you place an order.</li>
        <li>Payment information — processed securely through our payment gateway. We do not store card details.</li>
        <li>Browsing data such as pages visited, time spent, and device information — collected via cookies.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To process and fulfill your orders.</li>
        <li>To send order confirmation, tracking updates, and delivery notifications.</li>
        <li>To respond to customer service queries.</li>
        <li>To improve our website and shopping experience.</li>
        <li>To send promotional offers and new arrivals (you can unsubscribe anytime).</li>
      </ul>

      <h2>Third-Party Services</h2>
      <ul>
        <li>We use Meta Pixel and Google Analytics to understand website traffic and improve our marketing. These tools may collect anonymized browsing data.</li>
        <li>Payment processing is handled by our payment gateway partner. We do not have access to your card or banking details.</li>
        <li>We do not sell, trade, or rent your personal information to third parties.</li>
      </ul>

      <h2>Cookies</h2>
      <ul>
        <li>Our website uses cookies to enhance your browsing experience.</li>
        <li>You can choose to disable cookies in your browser settings, but this may affect website functionality.</li>
      </ul>

      <h2>Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or disclosure.</p>

      <h2>Contact Us</h2>
      <p>For any privacy-related queries, contact us at <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a> or <strong>+91 99799 05952</strong>.</p>
    `
  },
  'terms-of-service': {
    title: 'Terms & Conditions',
    body: `
      <p>By accessing or using the Atsevam website (atsevam.com), you agree to be bound by the following terms and conditions.</p>

      <h2>General</h2>
      <ul>
        <li>Atsevam is a retail brand operated by Warthy Ent, Surat, Gujarat.</li>
        <li>We reserve the right to modify these terms at any time without prior notice. Continued use of the website constitutes acceptance of updated terms.</li>
      </ul>

      <h2>Orders & Pricing</h2>
      <ul>
        <li>All prices displayed on the website are inclusive of GST.</li>
        <li>Prices are subject to change without notice.</li>
        <li>We reserve the right to cancel any order in case of pricing errors, stock unavailability, or suspected fraud.</li>
        <li>In case of cancellation, a full refund will be issued to the original payment method.</li>
      </ul>

      <h2>Payment</h2>
      <ul>
        <li>We accept prepaid orders via all major credit/debit cards, UPI, net banking, and digital wallets. Cash on Delivery (COD) is available for orders above ₹2,000 with a mandatory advance payment of ₹99 at the time of order placement.</li>
        <li>Payments are processed securely through our payment gateway. Atsevam does not store any card or banking information.</li>
      </ul>

      <h2>Cancellation</h2>
      <ul>
        <li>Orders can be cancelled within 24 hours of placement by contacting us at <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a> or <strong>+91 99799 05952</strong>.</li>
        <li>Once dispatched, orders cannot be cancelled.</li>
      </ul>

      <h2>Intellectual Property</h2>
      <ul>
        <li>All content on this website including images, text, logos, and designs are the property of Atsevam / Warthy Ent.</li>
        <li>Unauthorized use, reproduction, or distribution of any content is strictly prohibited.</li>
      </ul>

      <h2>Limitation of Liability</h2>
      <ul>
        <li>Atsevam is not liable for any indirect, incidental, or consequential damages arising from the use of our products or website.</li>
        <li>Our liability is limited to the value of the order placed.</li>
      </ul>

      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Surat, Gujarat.</p>

      <h2>Contact</h2>
      <p>For any queries related to these terms, contact us at <a href="mailto:atsevam1@gmail.com">atsevam1@gmail.com</a> or <strong>+91 99799 05952</strong>.</p>
    `
  }
};

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `${data?.policy.title ?? 'Policy'} — Atsevam`}];
};

export async function loader({params}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policy = LOCAL_POLICIES[handle];
  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="av-policy-page">
      <div className="container container--narrow">
        <div className="av-policy-page__back">
          <Link to="/policies">← Back to Policies</Link>
        </div>
        <h1 className="av-policy-page__title">{policy.title}</h1>
        <div className="av-policy-page__content" dangerouslySetInnerHTML={{__html: policy.body}} />
      </div>
    </div>
  );
}
