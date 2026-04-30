import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'My Orders — Atsevam'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="av-acct-section">
      <div className="av-acct-section__head">
        <h1 className="av-acct-section__title">My Orders</h1>
        <p className="av-acct-section__sub">Track and manage your purchases</p>
      </div>
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="av-acct-orders" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="av-acct-empty">
      <div className="av-acct-empty__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="av-acct-empty__text">No orders found matching your search.</p>
          <Link to="/account/orders" className="av-acct-empty__cta">Clear filters</Link>
        </>
      ) : (
        <>
          <p className="av-acct-empty__text">You haven&apos;t placed any orders yet.</p>
          <Link to="/collections/all" className="btn btn-primary">Start Shopping</Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();
    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);
    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="av-acct-search"
      aria-label="Search orders"
    >
      <div className="av-acct-search__inputs">
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order number"
          aria-label="Order number"
          defaultValue={currentFilters.name || ''}
          className="av-acct-search__input"
        />
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation number"
          aria-label="Confirmation number"
          defaultValue={currentFilters.confirmationNumber || ''}
          className="av-acct-search__input"
        />
      </div>
      <div className="av-acct-search__actions">
        <button type="submit" className="btn btn-primary" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        {hasFilters && (
          <button
            type="button"
            className="av-acct-search__clear"
            disabled={isSearching}
            onClick={() => {
              setSearchParams(new URLSearchParams());
              formRef.current?.reset();
            }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase();
  if (s === 'paid' || s === 'fulfilled' || s === 'delivered') return 'green';
  if (s === 'pending' || s === 'in_progress' || s === 'unfulfilled') return 'amber';
  if (s === 'refunded' || s === 'cancelled' || s === 'voided') return 'red';
  return 'neutral';
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  const date = new Date(order.processedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="av-acct-order">
      {/* Header row */}
      <div className="av-acct-order__head">
        <div>
          <span className="av-acct-order__number">Order #{order.number}</span>
          {order.confirmationNumber && (
            <span className="av-acct-order__confirm">
              Confirmation: {order.confirmationNumber}
            </span>
          )}
        </div>
        <span className="av-acct-order__date">{date}</span>
      </div>

      {/* Badges + Total */}
      <div className="av-acct-order__meta">
        <div className="av-acct-order__badges">
          <span className={`av-acct-badge av-acct-badge--${getStatusColor(order.financialStatus ?? '')}`}>
            {order.financialStatus}
          </span>
          {fulfillmentStatus && (
            <span className={`av-acct-badge av-acct-badge--${getStatusColor(fulfillmentStatus)}`}>
              {fulfillmentStatus}
            </span>
          )}
        </div>
        <div className="av-acct-order__total">
          <Money data={order.totalPrice} />
        </div>
      </div>

      {/* Footer CTA */}
      <div className="av-acct-order__footer">
        <Link
          to={`/account/orders/${btoa(order.id)}`}
          className="av-acct-order__view-btn"
        >
          View Details
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
