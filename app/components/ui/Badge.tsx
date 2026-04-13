type BadgeVariant = 'bestseller' | 'new' | 'top-rated' | 'sale';

type BadgeProps = {
  variant: BadgeVariant;
  label?: string;
};

const variantMap: Record<BadgeVariant, {cls: string; defaultLabel: string}> = {
  bestseller:  {cls: 'badge badge-bestseller', defaultLabel: 'Bestseller'},
  new:         {cls: 'badge badge-new',        defaultLabel: 'New'},
  'top-rated': {cls: 'badge badge-top-rated',  defaultLabel: 'Top Rated'},
  sale:        {cls: 'badge badge-sale',        defaultLabel: 'Sale'},
};

export function Badge({variant, label}: BadgeProps) {
  const {cls, defaultLabel} = variantMap[variant];
  return <span className={cls}>{label ?? defaultLabel}</span>;
}
