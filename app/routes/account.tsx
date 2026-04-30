import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const greeting = customer?.firstName
    ? `Hi, ${customer.firstName}`
    : 'My Account';

  const initials = customer?.firstName && customer?.lastName
    ? `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
    : customer?.firstName
    ? customer.firstName[0].toUpperCase()
    : '?';

  return (
    <div className="av-account container">
      {/* Sidebar */}
      <aside className="av-account__sidebar">
        {/* Avatar + greeting */}
        <div className="av-account__user">
          <div className="av-account__avatar">{initials}</div>
          <div>
            <p className="av-account__greeting">{greeting}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="av-account__nav" aria-label="Account navigation">
          <NavLink
            to="/account/orders"
            className={({isActive}) =>
              `av-account__nav-item${isActive ? ' av-account__nav-item--active' : ''}`
            }
          >
            <span className="av-account__nav-icon">📦</span>
            My Orders
          </NavLink>
          <NavLink
            to="/account/profile"
            className={({isActive}) =>
              `av-account__nav-item${isActive ? ' av-account__nav-item--active' : ''}`
            }
          >
            <span className="av-account__nav-icon">👤</span>
            Profile
          </NavLink>
          <NavLink
            to="/account/addresses"
            className={({isActive}) =>
              `av-account__nav-item${isActive ? ' av-account__nav-item--active' : ''}`
            }
          >
            <span className="av-account__nav-icon">📍</span>
            Addresses
          </NavLink>
        </nav>

        {/* Sign out */}
        <Form className="av-account__logout" method="POST" action="/account/logout">
          <button type="submit" className="av-account__logout-btn">
            <span className="av-account__nav-icon">🚪</span>
            Sign Out
          </button>
        </Form>
      </aside>

      {/* Main content pane */}
      <main className="av-account__main">
        <Outlet context={{customer}} />
      </main>
    </div>
  );
}

