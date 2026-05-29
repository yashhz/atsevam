import {NavLink} from 'react-router';
import {useAside} from '~/components/Aside';
import {Icon} from '~/components/ui/Icon';

export function FloatingDock() {
  const {open} = useAside();

  return (
    <div className="av-floating-dock" aria-label="Quick Actions">
      <NavLink
        to="/account"
        className={({isActive}) =>
          `av-floating-dock__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="Account"
      >
        <span className="av-floating-dock__icon-wrapper">
          <Icon name="user" size={18} strokeWidth={1.25} />
        </span>
        <span className="av-floating-dock__tooltip">Account</span>
      </NavLink>

      <NavLink
        to="/collections"
        className={({isActive}) =>
          `av-floating-dock__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="Collections"
      >
        <span className="av-floating-dock__icon-wrapper">
          <Icon name="grid" size={18} strokeWidth={1.25} />
        </span>
        <span className="av-floating-dock__tooltip">Collections</span>
      </NavLink>

      <NavLink
        to="/collections/all"
        className={({isActive}) =>
          `av-floating-dock__item ${isActive ? 'is-active' : ''}`
        }
        aria-label="New Arrivals"
      >
        <div className="av-floating-dock__starburst-wrap">
          <Icon name="starburst-new" size={24} strokeWidth={1} className="av-starburst-icon" />
          <span className="av-starburst-text">NEW</span>
        </div>
        <span className="av-floating-dock__tooltip">New Arrivals</span>
      </NavLink>

      <button
        onClick={() => open('cart')}
        className="av-floating-dock__item av-floating-dock__cart-btn"
        aria-label="Open Cart"
      >
        <span className="av-floating-dock__icon-wrapper">
          <Icon name="cart" size={18} strokeWidth={1.25} />
        </span>
        <span className="av-floating-dock__tooltip">Cart</span>
      </button>
    </div>
  );
}
