import {useState} from 'react';
import {Icon} from '~/components/ui/Icon';
import type {FilterGroup} from '~/lib/mock';

type ActiveFilters = Record<string, string[]>;

type FilterSidebarProps = {
  filters: FilterGroup[];
  activeFilters: ActiveFilters;
  onFilterChange: (groupId: string, value: string) => void;
  onClearAll: () => void;
  totalCount: number;
};

export function FilterSidebar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  totalCount,
}: FilterSidebarProps) {
  const activeCount = Object.values(activeFilters).flat().length;

  return (
    <aside className="av-filter-sidebar">
      {/* Header */}
      <div className="av-filter-sidebar__header">
        <span className="av-filter-sidebar__title">Filters</span>
        {activeCount > 0 && (
          <button className="btn btn-ghost av-filter-sidebar__clear" onClick={onClearAll}>
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="av-filter-chips">
          {Object.entries(activeFilters).flatMap(([groupId, values]) =>
            values.map((val) => {
              const group = filters.find((f) => f.id === groupId);
              const opt = group?.options.find((o) => o.value === val);
              return (
                <button
                  key={`${groupId}-${val}`}
                  className="av-filter-chip"
                  onClick={() => onFilterChange(groupId, val)}
                >
                  {opt?.label ?? val}
                  <Icon name="close" size={12} strokeWidth={2} />
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Filter groups */}
      <div className="av-filter-groups">
        {filters.map((group) => (
          <FilterGroup
            key={group.id}
            group={group}
            active={activeFilters[group.id] ?? []}
            onChange={(val) => onFilterChange(group.id, val)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─── Single filter group (collapsible) ───────────────────────────

function FilterGroup({
  group,
  active,
  onChange,
}: {
  group: FilterGroup;
  active: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="av-filter-group">
      <button
        className="av-filter-group__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{group.label}</span>
        <Icon
          name="chevron-down"
          size={14}
          strokeWidth={1.5}
          className={`av-filter-group__icon${open ? ' av-filter-group__icon--open' : ''}`}
        />
      </button>

      {open && (
        <div className="av-filter-group__options">
          {group.options.map((opt) => {
            const checked = active.includes(opt.value);
            return (
              <label key={opt.value} className="av-filter-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                  className="av-filter-option__checkbox"
                />
                <span className="av-filter-option__box">
                  {checked && <Icon name="close" size={9} strokeWidth={2.5} />}
                </span>
                <span className="av-filter-option__label">{opt.label}</span>
                <span className="av-filter-option__count">{opt.count}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mobile filter drawer trigger ────────────────────────────────

type MobileFilterTriggerProps = {
  activeCount: number;
  onClick: () => void;
};

export function MobileFilterTrigger({activeCount, onClick}: MobileFilterTriggerProps) {
  return (
    <button className="av-mobile-filter-trigger" onClick={onClick}>
      <Icon name="menu" size={16} strokeWidth={1.5} />
      <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
    </button>
  );
}

// ─── Mobile filter drawer ─────────────────────────────────────────

type MobileFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  filters: FilterGroup[];
  activeFilters: ActiveFilters;
  onFilterChange: (groupId: string, value: string) => void;
  onClearAll: () => void;
  totalCount: number;
};

export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  totalCount,
}: MobileFilterDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`overlay${open ? ' expanded' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides up from bottom */}
      <div className={`av-filter-drawer${open ? ' av-filter-drawer--open' : ''}`}>
        <div className="av-filter-drawer__header">
          <span className="av-filter-sidebar__title">Filters</span>
          <button className="av-header__icon-btn" onClick={onClose} aria-label="Close filters">
            <Icon name="close" size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="av-filter-drawer__body">
          <FilterSidebar
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
            totalCount={totalCount}
          />
        </div>
        <div className="av-filter-drawer__footer">
          <button className="btn btn-primary btn-full" onClick={onClose}>
            Show {totalCount} Results
          </button>
        </div>
      </div>
    </>
  );
}
