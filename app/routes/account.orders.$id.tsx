import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Order ${data?.order?.name} — Atsevam`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'UNFULFILLED';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  const date = new Date(order.processedAt!).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Timeline Steps Calculations
  const isShipped = ['FULFILLED', 'RESTOCKED'].includes(fulfillmentStatus);
  const isDelivered = fulfillmentStatus === 'FULFILLED'; // Simple map for demo purposes

  const timelineSteps = [
    { label: 'Placed', active: true },
    { label: 'Confirmed', active: true },
    { label: 'Shipped', active: isShipped },
    { label: 'Delivered', active: isDelivered },
  ];

  return (
    <div className="av-acct-section">
      <div className="av-acct-order-detail">
        {/* Back Link */}
        <div>
          <Link to="/account/orders" className="av-acct-order-detail__back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Orders
          </Link>
        </div>

        {/* Header */}
        <div className="av-acct-order-detail__head">
          <h1 className="av-acct-order-detail__number">Order {order.name}</h1>
          <span className="av-acct-order-detail__date">Placed on {date}</span>
        </div>

        {/* Visual Progress Timeline */}
        <div className="av-acct-timeline">
          {timelineSteps.map((step, idx) => (
            <div
              key={step.label}
              className={`av-acct-timeline__step${step.active ? ' av-acct-timeline__step--active' : ''}`}
            >
              <div className="av-acct-timeline__dot">
                {step.active ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className="av-acct-timeline__label">{step.label}</span>
              <div className="av-acct-timeline__line"></div>
            </div>
          ))}
        </div>

        {/* 2-Column Detail Grid */}
        <div className="av-acct-order-detail__grid">
          {/* Main items and billing */}
          <div className="av-acct-order-detail__main">
            {/* Ordered Items */}
            <div className="av-acct-order-detail__section">
              <h2 className="av-acct-order-detail__section-title">Items Ordered</h2>
              <div className="av-acct-order-detail__items">
                {lineItems.map((lineItem, lineItemIndex) => (
                  <div key={lineItemIndex} className="av-acct-order-detail-item">
                    <div className="av-acct-order-detail-item__img">
                      {lineItem?.image ? (
                        <Image data={lineItem.image} width={75} height={94} sizes="75px" />
                      ) : (
                        <div className="w-full h-full bg-stone-100" />
                      )}
                    </div>
                    <div className="av-acct-order-detail-item__info">
                      <p className="av-acct-order-detail-item__title">{lineItem.title}</p>
                      <div className="av-acct-order-detail-item__meta">
                        {lineItem.variantTitle && <span>Variant: {lineItem.variantTitle}</span>}
                        <span>Qty: {lineItem.quantity}</span>
                      </div>
                      <span className="av-acct-order-detail-item__price">
                        <Money data={lineItem.price!} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="av-acct-order-detail__section">
              <h2 className="av-acct-order-detail__section-title">Payment Details</h2>
              <div className="av-acct-order-detail__billing">
                <div className="av-acct-order-detail__billing-row">
                  <span>Subtotal</span>
                  <span>
                    <Money data={order.subtotal!} />
                  </span>
                </div>

                {((discountValue && discountValue.amount) || discountPercentage) && (
                  <div className="av-acct-order-detail__billing-row">
                    <span>Discounts</span>
                    <span className="text-emerald-700 font-semibold">
                      {discountPercentage ? (
                        <span>-{discountPercentage}% OFF</span>
                      ) : (
                        discountValue && <Money data={discountValue!} />
                      )}
                    </span>
                  </div>
                )}

                <div className="av-acct-order-detail__billing-row">
                  <span>Estimated Tax</span>
                  <span>
                    <Money data={order.totalTax!} />
                  </span>
                </div>

                <div className="av-acct-order-detail__billing-row av-acct-order-detail__billing-row--total">
                  <span>Total Amount</span>
                  <span>
                    <Money data={order.totalPrice!} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar shipping & status */}
          <div className="av-acct-order-detail__aside">
            {/* Delivery address */}
            <div className="av-acct-order-detail__section">
              <h2 className="av-acct-order-detail__section-title">Delivery Address</h2>
              {order?.shippingAddress ? (
                <div className="av-acct-order-detail__address">
                  <p>{order.shippingAddress.name}</p>
                  {order.shippingAddress.formatted?.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                  {order.shippingAddress.phoneNumber && (
                    <p className="mt-2 text-stone-500">Phone: {order.shippingAddress.phoneNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-stone-500 text-sm">No shipping address defined</p>
              )}
            </div>

            {/* Status & tracking actions */}
            <div className="av-acct-order-detail__section">
              <h2 className="av-acct-order-detail__section-title">Order Status</h2>
              <div className="mb-5">
                <p className="text-sm text-stone-600 mb-2">
                  Fulfillment: <span className="font-semibold text-stone-900">{fulfillmentStatus}</span>
                </p>
                <p className="text-sm text-stone-600">
                  Payment: <span className="font-semibold text-stone-900">{order.financialStatus}</span>
                </p>
              </div>

              {order.statusPageUrl && (
                <a
                  target="_blank"
                  href={order.statusPageUrl}
                  rel="noreferrer"
                  className="av-acct-order-detail__track-btn"
                >
                  Track Package
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
