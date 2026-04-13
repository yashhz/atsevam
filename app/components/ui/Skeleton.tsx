type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** Pulsing grey placeholder — use instead of spinners */
export function Skeleton({className = '', style}: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Pre-built skeleton for a product card */
export function ProductCardSkeleton() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
      <Skeleton style={{aspectRatio: '4/5', width: '100%', borderRadius: 'var(--radius-md)'}} />
      <Skeleton className="skeleton-text" style={{width: '70%'}} />
      <Skeleton className="skeleton-text" style={{width: '40%'}} />
    </div>
  );
}

/** Pre-built skeleton for a hero banner */
export function HeroSkeleton() {
  return (
    <Skeleton style={{width: '100%', aspectRatio: '16/7', borderRadius: 0}} />
  );
}
