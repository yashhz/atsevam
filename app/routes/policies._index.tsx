import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';

export async function loader() {
  const policies = [
    {id: 'shipping-policy', handle: 'shipping-policy', title: 'Shipping & Delivery Policy'},
    {id: 'refund-policy', handle: 'refund-policy', title: 'Return & Exchange Policy'},
    {id: 'privacy-policy', handle: 'privacy-policy', title: 'Privacy Policy'},
    {id: 'terms-of-service', handle: 'terms-of-service', title: 'Terms & Conditions'},
  ];
  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="av-policy-page">
      <div className="container container--narrow">
        <h1 className="av-policy-page__title">Website Policies</h1>
        <div className="av-policy-list" style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'}}>
          {policies.map((policy) => (
            <Link 
              key={policy.id} 
              to={`/policies/${policy.handle}`} 
              className="btn btn-secondary" 
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                padding: 'var(--space-4) var(--space-6)',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: '400',
              }}
            >
              {policy.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
