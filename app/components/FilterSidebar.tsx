import {useState, useRef, useEffect} from 'react';
import {Icon} from '~/components/ui/Icon';
import type {FilterGroup} from '~/lib/mock';

type ActiveFilters = Record<string, string[]>;

// ─── Color mapping for color swatches ─────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'red': '#E74C3C',
  'pink': '#FF69B4',
  'blue': '#3498DB',
  'green': '#27AE60',
  'yellow': '#F1C40F',
  'orange': '#E67E22',
  'purple': '#9B59B6',
  'black': '#2C3E50',
  'white': '#FAFAFA',
  'grey': '#95A5A6',
  'gray': '#95A5A6',
  'brown': '#8B4513',
  'beige': '#F5F5DC',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'maroon': '#800000',
  'navy': '#000080',
  'olive': '#808000',
  'teal': '#008080',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'lavender': '#E6E6FA',
  'peach': '#FFDAB9',
  'coral': '#FF7F50',
  'magenta': '#FF00FF',
  'rust': '#B7410E',
  'mustard': '#FFDB58',
  'sage': '#9DC183',
  'wine': '#722F37',
  'mint': '#98FF98',
  'turquoise': '#40E0D0',
  'rose': '#FF007F',
};

// ─── Desktop Filter Sidebar ──────────────────────────────────────

type FilterSidebarProps = {
  filters: FilterGroup[];
  activeFilters: ActiveFilters;
  onFilterChange: (groupId: string, value: string) => void;
  onClearAll: () => void;
  onClearGroup: (groupId: string) => void;
  totalCount: number;
};

export function FilterSidebar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  onClearGroup,
  totalCount,
}: FilterSidebarProps) {
  return (
    <aside className="av-sidebar">
      <div className="av-sidebar__inner">
        {/* Filter groups */}
        {filters.map((group) => (
          <FilterGroupSection
            key={group.id}
            group={group}
            active={activeFilters[group.id] ?? []}
            onChange={(val) => onFilterChange(group.id, val)}
            onClear={() => onClearGroup(group.id)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─── Single filter group with expand/collapse ─────────────────────

function FilterGroupSection({
  group,
  active,
  onChange,
  onClear,
}: {
  group: FilterGroup;
  active: string[];
  onChange: (val: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const isColor = group.id === 'color';
  const VISIBLE_LIMIT = 7;
  const visibleOptions = showAll ? group.options : group.options.slice(0, VISIBLE_LIMIT);
  const hasMore = group.options.length > VISIBLE_LIMIT;

  return (
    <div className="av-fgroup">
      {/* Group header - clickable to expand/collapse */}
      <button
        className="av-fgroup__header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="av-fgroup__title">{group.label.toUpperCase()}</span>
        <Icon
          name="chevron-down"
          size={14}
          strokeWidth={1.5}
          className={`av-fgroup__chevron${expanded ? ' av-fgroup__chevron--open' : ''}`}
        />
      </button>

      {/* Options list */}
      {expanded && (
        <div className="av-fgroup__body">
          {/* Clear this group if any selected */}
          {active.length > 0 && (
            <button className="av-fgroup__clear" onClick={onClear}>
              clear
            </button>
          )}

          {isColor ? (
            <div className="av-fgroup__colors">
              {visibleOptions.map((opt) => {
                const checked = active.includes(opt.value);
                const hex = COLOR_MAP[opt.value.toLowerCase()] || '#95A5A6';
                return (
                  <label
                    key={opt.value}
                    className={`av-color-option${checked ? ' av-color-option--active' : ''}`}
                    title={opt.label}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChange(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className="av-color-option__swatch"
                      style={{backgroundColor: hex}}
                    />
                    <span className="av-color-option__name">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="av-fgroup__options">
              {visibleOptions.map((opt) => {
                const checked = active.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`av-foption${checked ? ' av-foption--checked' : ''}`}
                  >
                    <span className="av-foption__check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onChange(opt.value)}
                      />
                      <span className="av-foption__box">
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="av-foption__label">{opt.label}</span>
                    <span className="av-foption__count">({opt.count})</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Show more/less */}
          {hasMore && (
            <button
              className="av-fgroup__more"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? '- Show less'
                : `+ ${group.options.length - VISIBLE_LIMIT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mobile filter trigger ────────────────────────────────────────

type MobileFilterTriggerProps = {
  activeCount: number;
  onClick: () => void;
};

export function MobileFilterTrigger({activeCount, onClick}: MobileFilterTriggerProps) {
  return (
    <button className="av-mobile-filter-btn" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="av-mobile-filter-btn__badge">{activeCount}</span>
      )}
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
  onClearGroup: (groupId: string) => void;
  totalCount: number;
};

export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  onClearGroup,
  totalCount,
}: MobileFilterDrawerProps) {
  const activeCount = Object.values(activeFilters).flat().length;

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`av-drawer-overlay${open ? ' av-drawer-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`av-filter-drawer${open ? ' av-filter-drawer--open' : ''}`}>
        {/* Header */}
        <div className="av-filter-drawer__head">
          <div className="av-filter-drawer__head-left">
            <span className="av-filter-drawer__title">FILTERS</span>
            {activeCount > 0 && (
              <span className="av-filter-drawer__count">{activeCount} applied</span>
            )}
          </div>
          <button
            className="av-filter-drawer__close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <Icon name="close" size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <div className="av-filter-drawer__clear-wrap">
            <button className="av-filter-drawer__clear-btn" onClick={onClearAll}>
              CLEAR ALL
            </button>
          </div>
        )}

        {/* Scrollable filter content */}
        <div className="av-filter-drawer__body">
          {filters.map((group) => (
            <FilterGroupSection
              key={group.id}
              group={group}
              active={activeFilters[group.id] ?? []}
              onChange={(val) => onFilterChange(group.id, val)}
              onClear={() => onClearGroup(group.id)}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="av-filter-drawer__footer">
          <button className="av-filter-drawer__apply" onClick={onClose}>
            Show {totalCount} Products
          </button>
        </div>
      </div>
    </>
  );
}
