import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';
import {useState, useEffect} from 'react';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'My Addresses — Atsevam'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();
  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {status: 401},
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
            addressId,
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return data(
            {error: {[addressId]: message}},
            {status: 400},
          );
        }
      }

      case 'PUT': {
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
            addressId,
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return data(
            {error: {[addressId]: message}},
            {status: 400},
          );
        }
      }

      case 'DELETE': {
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId, addressId};
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return data(
            {error: {[addressId]: message}},
            {status: 400},
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {status: 405},
        );
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return data(
      {error: {'NEW_ADDRESS_ID': message}},
      {status: 400},
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;
  const actionData = useActionData<ActionResponse>();

  // State to manage toggleable and sorted address experience
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState<boolean>(false);

  // Auto collapse forms upon successful submit
  useEffect(() => {
    if (actionData && !actionData.error) {
      if (actionData.createdAddress) {
        setShowAddNew(false);
      }
      if (actionData.updatedAddress || actionData.deletedAddress) {
        setEditingAddressId(null);
      }
    }
  }, [actionData]);

  return (
    <div className="av-acct-section">
      <div className="av-acct-section__head">
        <h1 className="av-acct-section__title">Addresses</h1>
        <p className="av-acct-section__sub">Manage your shipping and billing details</p>
      </div>

      <div className="av-account-addresses">
        {/* ─── Add New Address Collapsible Form ───────────────── */}
        {showAddNew && (
          <div className="av-acct-address-form-collapse">
            <div className="av-acct-form__card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Add New Address</span>
              <button
                type="button"
                className="av-acct-address-card__btn av-acct-address-card__btn--delete"
                onClick={() => setShowAddNew(false)}
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
            <NewAddressForm />
          </div>
        )}

        {/* ─── Edit Address Collapsible Form ──────────────────── */}
        {editingAddressId && (
          (() => {
            const addressToEdit = addresses.nodes.find(a => a.id === editingAddressId);
            if (!addressToEdit) return null;
            return (
              <div className="av-acct-address-form-collapse">
                <div className="av-acct-form__card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Edit Saved Address</span>
                  <button
                    type="button"
                    className="av-acct-address-card__btn av-acct-address-card__btn--delete"
                    onClick={() => setEditingAddressId(null)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                </div>
                <EditAddressForm address={addressToEdit} defaultAddress={defaultAddress} />
              </div>
            );
          })()
        )}

        {/* ─── Sorted Address Cards Grid ──────────────────────── */}
        <div>
          <h3 className="av-account-addresses__subtitle">Saved Addresses</h3>
          <div className="av-acct-address-grid">
            {/* Elegant Add New button slot */}
            {!showAddNew && (
              <button
                type="button"
                className="av-acct-address-new-btn"
                onClick={() => {
                  setShowAddNew(true);
                  setEditingAddressId(null);
                }}
                aria-label="Add new address"
              >
                <div className="av-acct-address-new-btn__content">
                  <div className="av-acct-address-new-btn__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="av-acct-address-new-btn__text">Add New Address</span>
                </div>
              </button>
            )}

            {/* Existing Address Cards */}
            {addresses.nodes.map((address) => {
              const isDefault = defaultAddress?.id === address.id;
              const isEditing = editingAddressId === address.id;

              return (
                <div key={address.id} className="av-acct-address-card" style={isEditing ? { borderColor: 'var(--color-brand)', boxShadow: '0 0 0 1px var(--color-brand)' } : undefined}>
                  <div className="av-acct-address-card__head">
                    <span className="av-acct-address-card__name">
                      {address.firstName} {address.lastName}
                    </span>
                    {isDefault && (
                      <span className="av-acct-address-card__default">Default</span>
                    )}
                  </div>

                  <div className="av-acct-address-card__body">
                    {address.company && <p style={{ fontWeight: 'var(--weight-semibold)' }}>{address.company}</p>}
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>
                      {address.city}
                      {address.zoneCode ? `, ${address.zoneCode}` : ''}
                      {address.zip ? ` ${address.zip}` : ''}
                    </p>
                    <p>{address.territoryCode}</p>
                    {address.phoneNumber && (
                      <p className="av-acct-address-card__phone">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        {address.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="av-acct-address-card__actions">
                    <button
                      type="button"
                      className="av-acct-address-card__btn"
                      onClick={() => {
                        setEditingAddressId(address.id);
                        setShowAddNew(false);
                        // Scroll smoothly to form container
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    
                    <Form method="DELETE">
                      <input type="hidden" name="addressId" value={address.id} />
                      <button
                        type="submit"
                        className="av-acct-address-card__btn av-acct-address-card__btn--delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        Delete
                      </button>
                    </Form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'NEW_ADDRESS_ID',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <div className="av-acct-form__buttons">
          <button
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
            className="btn btn-primary"
          >
            {stateForMethod('POST') !== 'idle' ? 'Adding Address...' : 'Add Address'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function EditAddressForm({
  address,
  defaultAddress,
}: {
  address: AddressFragment;
  defaultAddress: CustomerFragment['defaultAddress'];
}) {
  return (
    <AddressForm
      addressId={address.id}
      address={address}
      defaultAddress={defaultAddress}
    >
      {({stateForMethod}) => (
        <div className="av-acct-form__buttons">
          <button
            disabled={stateForMethod('PUT') !== 'idle'}
            formMethod="PUT"
            type="submit"
            className="btn btn-primary"
          >
            {stateForMethod('PUT') !== 'idle' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;

  return (
    <Form id={addressId} className="av-acct-form" style={{ marginTop: 'var(--space-4)' }}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }} disabled={state !== 'idle'}>
        <input type="hidden" name="addressId" defaultValue={addressId} />
        
        <div className="av-acct-form__grid">
          {/* First name */}
          <div className="av-acct-form__field">
            <label htmlFor={`firstName-${addressId}`} className="av-acct-form__label">
              First name*
            </label>
            <input
              aria-label="First name"
              autoComplete="given-name"
              defaultValue={address?.firstName ?? ''}
              id={`firstName-${addressId}`}
              name="firstName"
              placeholder="First name"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Last name */}
          <div className="av-acct-form__field">
            <label htmlFor={`lastName-${addressId}`} className="av-acct-form__label">
              Last name*
            </label>
            <input
              aria-label="Last name"
              autoComplete="family-name"
              defaultValue={address?.lastName ?? ''}
              id={`lastName-${addressId}`}
              name="lastName"
              placeholder="Last name"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Company */}
          <div className="av-acct-form__field">
            <label htmlFor={`company-${addressId}`} className="av-acct-form__label">
              Company
            </label>
            <input
              aria-label="Company"
              autoComplete="organization"
              defaultValue={address?.company ?? ''}
              id={`company-${addressId}`}
              name="company"
              placeholder="Company"
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Phone */}
          <div className="av-acct-form__field">
            <label htmlFor={`phoneNumber-${addressId}`} className="av-acct-form__label">
              Phone
            </label>
            <input
              aria-label="Phone Number"
              autoComplete="tel"
              defaultValue={address?.phoneNumber ?? ''}
              id={`phoneNumber-${addressId}`}
              name="phoneNumber"
              placeholder="+919999999999"
              type="tel"
              className="av-acct-form__input"
            />
          </div>

          {/* Address line 1 */}
          <div className="av-acct-form__field" style={{ gridColumn: 'span 2' }}>
            <label htmlFor={`address1-${addressId}`} className="av-acct-form__label">
              Address line 1*
            </label>
            <input
              aria-label="Address line 1"
              autoComplete="address-line1"
              defaultValue={address?.address1 ?? ''}
              id={`address1-${addressId}`}
              name="address1"
              placeholder="House/Flat No., Building, Street Name"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Address line 2 */}
          <div className="av-acct-form__field" style={{ gridColumn: 'span 2' }}>
            <label htmlFor={`address2-${addressId}`} className="av-acct-form__label">
              Address line 2
            </label>
            <input
              aria-label="Address line 2"
              autoComplete="address-line2"
              defaultValue={address?.address2 ?? ''}
              id={`address2-${addressId}`}
              name="address2"
              placeholder="Apartment, suite, unit, landmark, etc. (optional)"
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* City */}
          <div className="av-acct-form__field">
            <label htmlFor={`city-${addressId}`} className="av-acct-form__label">
              City*
            </label>
            <input
              aria-label="City"
              autoComplete="address-level2"
              defaultValue={address?.city ?? ''}
              id={`city-${addressId}`}
              name="city"
              placeholder="City"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* State / Province */}
          <div className="av-acct-form__field">
            <label htmlFor={`zoneCode-${addressId}`} className="av-acct-form__label">
              State / Province*
            </label>
            <input
              aria-label="State/Province"
              autoComplete="address-level1"
              defaultValue={address?.zoneCode ?? ''}
              id={`zoneCode-${addressId}`}
              name="zoneCode"
              placeholder="State / Province"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Zip Code */}
          <div className="av-acct-form__field">
            <label htmlFor={`zip-${addressId}`} className="av-acct-form__label">
              Zip / Postal Code*
            </label>
            <input
              aria-label="Zip"
              autoComplete="postal-code"
              defaultValue={address?.zip ?? ''}
              id={`zip-${addressId}`}
              name="zip"
              placeholder="Zip / Postal Code"
              required
              type="text"
              className="av-acct-form__input"
            />
          </div>

          {/* Country Code */}
          <div className="av-acct-form__field">
            <label htmlFor={`territoryCode-${addressId}`} className="av-acct-form__label">
              Country Code*
            </label>
            <input
              aria-label="Country code"
              autoComplete="country"
              defaultValue={address?.territoryCode ?? ''}
              id={`territoryCode-${addressId}`}
              name="territoryCode"
              placeholder="IN"
              required
              type="text"
              maxLength={2}
              className="av-acct-form__input"
            />
          </div>
        </div>

        {/* Default Address Checkbox */}
        <div className="av-acct-form__checkbox-container" style={{ marginTop: 'var(--space-5)' }}>
          <input
            defaultChecked={isDefaultAddress}
            id={`defaultAddress-${addressId}`}
            name="defaultAddress"
            type="checkbox"
            className="av-acct-form__checkbox"
          />
          <label htmlFor={`defaultAddress-${addressId}`} className="av-acct-form__checkbox-label">
            Set as default address
          </label>
        </div>

        {/* Error notification */}
        {error && (
          <div className="av-acct-form__error" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {children({
          stateForMethod: (method) => (formMethod === method ? state : 'idle'),
        })}
      </fieldset>
    </Form>
  );
}
