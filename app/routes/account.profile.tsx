import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'My Profile — Atsevam'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;
  const isSaving = state !== 'idle';
  const saved = action && !action.error && !isSaving;

  return (
    <div className="av-acct-section">
      <div className="av-acct-section__head">
        <h1 className="av-acct-section__title">Profile</h1>
        <p className="av-acct-section__sub">Manage your personal information</p>
      </div>

      <Form method="PUT" className="av-acct-form">
        <div className="av-acct-form__card">
          <p className="av-acct-form__card-title">Personal Information</p>
          <div className="av-acct-form__grid">
            <div className="av-acct-form__field">
              <label htmlFor="firstName" className="av-acct-form__label">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                aria-label="First name"
                defaultValue={customer.firstName ?? ''}
                minLength={2}
                className="av-acct-form__input"
              />
            </div>
            <div className="av-acct-form__field">
              <label htmlFor="lastName" className="av-acct-form__label">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                aria-label="Last name"
                defaultValue={customer.lastName ?? ''}
                minLength={2}
                className="av-acct-form__input"
              />
            </div>
          </div>
        </div>

        {action?.error && (
          <div className="av-acct-form__error" role="alert">
            {action.error}
          </div>
        )}

        {saved && (
          <div className="av-acct-form__success" role="status">
            Profile updated successfully.
          </div>
        )}

        <div className="av-acct-form__actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </div>
  );
}
