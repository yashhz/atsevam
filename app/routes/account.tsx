import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
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

const NAV_ITEMS = [
  {
    to: '/account/orders',
    label: 'My Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    to: '/account/profile',
    label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    to: '/account/addresses',
    label: 'Addresses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
];

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();
  const location = useLocation();

  const firstName = customer?.firstName ?? '';
  const lastName = customer?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'A';
  const email = customer?.emailAddress?.emailAddress ?? '';

  // Find active nav label for mobile header
  const activeItem = NAV_ITEMS.find(item =>
    location.pathname.startsWith(item.to)
  );

  return (
    <div className="av-acct">
      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="av-acct__mobile-bar">
        <span className="av-acct__mobile-title">{activeItem?.label ?? 'Account'}</span>
      </div>

      <div className="av-acct__layout container">
        {/* ── Sidebar ────────────────────────────────────────── */}
        <div className="av-acct__sidebar" role="complementary">
          {/* User card */}
          <div className="av-acct__user-card">
            <div className="av-acct__avatar">{initials}</div>
            <div className="av-acct__user-info">
              <p className="av-acct__user-name">{fullName}</p>
              {email && <p className="av-acct__user-email">{email}</p>}
            </div>
          </div>

          {/* Nav */}
          <nav className="av-acct__nav" aria-label="Account navigation">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) =>
                  `av-acct__nav-item${isActive ? ' av-acct__nav-item--active' : ''}`
                }
              >
                <span className="av-acct__nav-icon">{item.icon}</span>
                <span className="av-acct__nav-label">{item.label}</span>
                <svg className="av-acct__nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </NavLink>
            ))}
          </nav>

          {/* Sign out */}
          <Form method="POST" action="/account/logout" className="av-acct__signout-form">
            <button type="submit" className="av-acct__signout-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </Form>
        </div>

        {/* ── Mobile inline nav ──────────────────────────────── */}
        <nav className="av-acct__mobile-nav" aria-label="Account navigation">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({isActive}) =>
                `av-acct__mobile-nav-item${isActive ? ' av-acct__mobile-nav-item--active' : ''}`
              }
            >
              <span className="av-acct__mobile-nav-icon">{item.icon}</span>
              <span className="av-acct__mobile-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Main content ───────────────────────────────────── */}
        <main className="av-acct__main">
          <Outlet context={{customer}} />
        </main>
      </div>
    </div>
  );
}
