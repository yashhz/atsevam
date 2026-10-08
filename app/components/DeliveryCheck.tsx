import {useEffect, useState} from 'react';
import {Icon} from '~/components/ui/Icon';

const STORAGE_KEY = 'av_pincode';
// Indian PIN codes: 6 digits, first digit 1–9
const PIN_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * "Check delivery" box for the product page. We ship Pan-India within the
 * window the store states in its own policy, so this validates the pincode and
 * confirms that window — it does not invent a per-pincode date.
 */
export function DeliveryCheck({deliveryWindow}: {deliveryWindow: string}) {
  const [pin, setPin] = useState('');
  const [checkedPin, setCheckedPin] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && PIN_PATTERN.test(saved)) {
        setPin(saved);
        setCheckedPin(saved);
      }
    } catch {
      /* storage unavailable — fine */
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = pin.trim();
    if (!PIN_PATTERN.test(value)) {
      setCheckedPin(null);
      setError('Enter a valid 6-digit pincode');
      return;
    }
    setError('');
    setCheckedPin(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="av-delivery">
      <p className="av-delivery__title">
        <Icon name="truck" size={16} strokeWidth={1.25} />
        Check delivery
      </p>
      <form className="av-delivery__form" onSubmit={submit} noValidate>
        <input
          className="av-delivery__input"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="Enter pincode"
          aria-label="Delivery pincode"
          aria-invalid={error ? true : undefined}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            if (error) setError('');
          }}
        />
        <button type="submit" className="av-delivery__btn">
          Check
        </button>
      </form>
      {error && (
        <p className="av-delivery__msg av-delivery__msg--error" role="alert">
          {error}
        </p>
      )}
      {checkedPin && !error && (
        <p className="av-delivery__msg" aria-live="polite">
          Delivering to <strong>{checkedPin}</strong> in {deliveryWindow}. Cash on
          delivery available.
        </p>
      )}
    </div>
  );
}
