import type {Route} from './+types/pages.faq';
import {useState} from 'react';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: 'FAQ — Avestam'},
  {name: 'description', content: 'Frequently asked questions about Avestam products, shipping, returns, and more.'},
];

const FAQS = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'We deliver within 5-7 business days across India. You\'ll receive a tracking number once your order ships.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within India. International shipping will be available soon.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order ships, you\'ll receive a tracking link via email and SMS. You can also track your order from your account dashboard.',
      },
      {
        q: 'What if my order is delayed?',
        a: 'If your order is delayed beyond 7 business days, please contact us at support@avestam.com with your order number.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Go to your account dashboard, select the order, and click "Request Return". Our team will arrange a pickup within 2-3 business days.',
      },
      {
        q: 'Can I exchange for a different size?',
        a: 'Yes! Select "Exchange" when initiating your return and choose your preferred size. We\'ll ship the new size once we receive the original item.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item.',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        q: 'How do I choose the right size?',
        a: 'Check our detailed size guide for measurements. If you\'re between sizes, we recommend sizing up for a comfortable fit.',
      },
      {
        q: 'Are your products handmade?',
        a: 'Yes! Every piece is handcrafted by skilled artisans. This means each item is unique and may have slight variations.',
      },
      {
        q: 'How do I care for my Avestam garment?',
        a: 'We recommend dry cleaning for embroidered pieces. For everyday kurtis and co-ords, gentle hand wash or machine wash on delicate cycle.',
      },
      {
        q: 'Can I customize a design?',
        a: 'For bulk orders (10+ pieces), we offer customization. Contact us at wholesale@avestam.com for details.',
      },
    ],
  },
  {
    category: 'Payment & Pricing',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, net banking, and cash on delivery (COD) for orders under ₹10,000.',
      },
      {
        q: 'Is COD available?',
        a: 'Yes, COD is available for orders under ₹10,000. A small COD fee of ₹50 applies.',
      },
      {
        q: 'Do you offer discounts for bulk orders?',
        a: 'Yes! We have a B2B wholesale program with special pricing for boutiques and retailers. Visit our Wholesale page for details.',
      },
      {
        q: 'Are prices inclusive of GST?',
        a: 'Yes, all prices displayed include GST. No hidden charges.',
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
            Everything you need to know about shopping with Avestam
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
