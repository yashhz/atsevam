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
    <div className="av-account-section">
      <h2 className="av-account-section__title">My Orders</h2>
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
    <div className="av-account-orders" aria-live="polite">
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
    <div className="av-account-empty">
      {hasFilters ? (
        <>
          <p>No orders found matching your search.</p>
          <Link to="/account/orders" className="av-account-link">Clear filters →</Link>
        </>
      ) : (
        <>
          <p>You haven't placed any orders yet.</p>
          <Link to="/collections" className="btn btn-primary">Start Shopping</Link>
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
      className="av-account-search"
      aria-label="Search orders"
    >
      <div className="av-account-search__inputs">
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          aria-label="Order number"
          defaultValue={currentFilters.name || ''}
        />
        <input
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation #"
          aria-label="Confirmation number"
          defaultValue={currentFilters.confirmationNumber || ''}
        />
      </div>
      <div className="av-account-search__buttons">
        <button type="submit" className="btn btn-primary" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-secondary"
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

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <div className="av-account-order-item">
      <div className="av-account-order-item__header">
        <Link to={`/account/orders/${btoa(order.id)}`} className="av-account-order-item__number">
          #{order.number}
        </Link>
        <span className="av-account-order-item__date">
          {new Date(order.processedAt).toLocaleDateString()}
        </span>
      </div>
      <div className="av-account-order-item__details">
        {order.confirmationNumber && (
          <p className="av-account-order-item__confirmation">
            Confirmation: {order.confirmationNumber}
          </p>
        )}
        <div className="av-account-order-item__status">
          <span className="av-account-order-item__badge">{order.financialStatus}</span>
          {fulfillmentStatus && (
            <span className="av-account-order-item__badge">{fulfillmentStatus}</span>
          )}
        </div>
      </div>
      <div className="av-account-order-item__footer">
        <Money data={order.totalPrice} />
        <Link to={`/account/orders/${btoa(order.id)}`} className="av-account-link">
          View Details →
        </Link>
      </div>
    </div>
  );
}
