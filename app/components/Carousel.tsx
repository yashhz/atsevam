import {useRef, useState, useCallback} from 'react';
import {Icon} from '~/components/ui/Icon';

type CarouselProps = {
  children: React.ReactNode;
  title: string;
  viewAllUrl?: string;
};

export function Carousel({children, title, viewAllUrl}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({left: dir === 'right' ? amount : -amount, behavior: 'smooth'});
  };

  return (
    <section className="av-carousel">
      {/* Header row */}
      <div className="av-carousel__header container">
        <h2 className="section-heading">{title}</h2>
        <div className="av-carousel__controls">
          {viewAllUrl && (
            <a href={viewAllUrl} className="btn btn-ghost av-carousel__view-all">
              View All
            </a>
          )}
          <button
            className={`av-carousel__arrow${!canScrollLeft ? ' av-carousel__arrow--disabled' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
          >
            <Icon name="chevron-left" size={18} strokeWidth={1.5} />
          </button>
          <button
            className={`av-carousel__arrow${!canScrollRight ? ' av-carousel__arrow--disabled' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            disabled={!canScrollRight}
          >
            <Icon name="chevron-right" size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        className="av-carousel__track"
        ref={trackRef}
        onScroll={updateScrollState}
      >
        <div className="av-carousel__inner">
          {children}
        </div>
      </div>
    </section>
  );
}
