import type {Route} from './+types/pages.faq';
import {useState} from 'react';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'FAQ — Atsevam'},
  {name: 'description', content: 'Frequently asked questions about Atsevam products, shipping, returns, and more.'},
];

const FAQS = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'We dispatch all orders on the same day (for orders placed before cut-off time). Delivery takes 5–7 business days across India. You will receive a tracking number via Email and SMS once your order is dispatched.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within India. International shipping will be available soon.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order is dispatched, you will receive a tracking link via Email and SMS. You can also track your order from your account dashboard on atsevam.com.',
      },
      {
        q: 'What if my order is delayed?',
        a: 'If your order is delayed beyond 7 business days, please contact us at atsevam1@gmail.com or call +91 99799 05952 with your order number. We will resolve it at the earliest.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Yes, orders can be cancelled within 24 hours of placement. Once dispatched, orders cannot be cancelled. To cancel, email us at atsevam1@gmail.com or call +91 99799 05952.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 48 hours of delivery for damaged, wrong, or quality-issue products only. Items must be in original condition with tags attached.',
      },
      {
        q: 'How do I initiate a return or exchange?',
        a: 'Email us at atsevam1@gmail.com or call +91 99799 05952 within 48 hours of receiving your order. Share your order number and photos/video of the issue. Our team will guide you through the process.',
      },
      {
        q: 'Can I exchange for a different size or color?',
        a: 'Yes! Exchange is available for a different size or color of the same product, subject to availability. We will ship the replacement once we receive and inspect the original item.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refund will be credited to your original payment method (bank account / UPI).',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        q: 'How do I choose the right size?',
        a: 'Please refer to our detailed size guide available on each product page. If you are between sizes, we recommend sizing up for a comfortable fit. You can also contact us for sizing assistance.',
      },
      {
        q: 'Are your products handcrafted?',
        a: 'Yes! Our ethnic wear collection features intricate handcrafted work by skilled artisans. Each piece may have slight natural variations which add to its uniqueness.',
      },
      {
        q: 'How do I care for my Atsevam garment?',
        a: 'Dry cleaning is recommended for embroidered and embellished pieces. For kurtis and co-ords, gentle hand wash or machine wash on delicate cycle is advised. Avoid direct sunlight when drying.',
      },
      {
        q: 'Can I customize a design?',
        a: 'We offer customization for bulk orders (10+ pieces). Contact us at atsevam1@gmail.com or +91 99799 05952 for details and pricing.',
      },
    ],
  },
  {
    category: 'Payment & Pricing',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are processed securely.',
      },
      {
        q: 'Is COD (Cash on Delivery) available?',
        a: 'Yes, COD is available for orders above ₹2,000. A mandatory advance payment of ₹99 is required at the time of order placement to confirm your COD order. The remaining amount is paid at the time of delivery.',
      },
      {
        q: 'Are prices inclusive of GST?',
        a: 'Yes, all prices displayed on our website are inclusive of GST. There are no hidden charges.',
      },
      {
        q: 'Do you offer discounts for bulk orders?',
        a: 'Yes! We have a B2B wholesale program with special pricing for boutiques and retailers. Visit our Wholesale page or contact us at atsevam1@gmail.com for details.',
      },
    ],
  },
];

function FAQItem({question, answer}: {question: string; answer: string}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="av-faq__item">
      <button
        className="av-faq__question"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <Icon name={isOpen ? 'minus' : 'plus'} size={18} />
      </button>
      {isOpen && (
        <div className="av-faq__answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="av-faq-page">
      <div className="container container--narrow">
        <header className="av-faq-page__header">
          <h1 className="av-faq-page__title">Frequently Asked Questions</h1>
          <p className="av-faq-page__subtitle">
            Everything you need to know about shopping with Atsevam
          </p>
        </header>

        <div className="av-faq__categories">
          {FAQS.map((category) => (
            <section key={category.category} className="av-faq__category">
              <h2 className="av-faq__category-title">{category.category}</h2>
              <div className="av-faq__list">
                {category.questions.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="av-faq-page__contact">
          <p>Still have questions?</p>
          <a href="/pages/contact" className="btn btn-primary">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
