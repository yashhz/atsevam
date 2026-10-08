import {useCallback, useEffect, useRef, useState} from 'react';
import {Icon} from '~/components/ui/Icon';
import {shopifyImage} from '~/lib/image';

type LightboxImage = {url: string; altText?: string | null};

type ImageLightboxProps = {
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Full-screen product photo viewer: swipe / arrow keys to move, tap the photo
 * to zoom in (scroll to pan), Escape or ✕ to close.
 */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const total = images.length;

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      onIndexChange((index + delta + total) % total);
    },
    [index, total, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && total > 1) go(1);
      else if (e.key === 'ArrowLeft' && total > 1) go(-1);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose, total]);

  // When zooming, start the pan from the middle of the enlarged photo
  useEffect(() => {
    const el = stageRef.current;
    if (zoomed && el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 3;
    }
  }, [zoomed]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="av-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Product photos"
    >
      <div className="av-lightbox__bar">
        <span className="av-lightbox__count">
          {index + 1} / {total}
        </span>
        <button
          ref={closeRef}
          type="button"
          className="av-lightbox__close"
          onClick={onClose}
          aria-label="Close photo viewer"
        >
          <Icon name="close" size={22} strokeWidth={1.75} />
        </button>
      </div>

      <div
        ref={stageRef}
        className={`av-lightbox__stage${zoomed ? ' av-lightbox__stage--zoomed' : ''}`}
        onTouchStart={(e) => {
          if (!zoomed) setTouchStartX(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          if (touchStartX === null || zoomed || total < 2) return;
          const diff = touchStartX - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
          setTouchStartX(null);
        }}
      >
        <button
          type="button"
          className="av-lightbox__zoom-btn"
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          onClick={() => setZoomed((z) => !z)}
        >
          <img
            src={shopifyImage(current.url, 1600)}
            alt={current.altText || ''}
            className="av-lightbox__img"
            draggable={false}
          />
        </button>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="av-lightbox__nav av-lightbox__nav--prev"
            onClick={() => go(-1)}
            aria-label="Previous photo"
          >
            <Icon name="chevron-left" size={26} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="av-lightbox__nav av-lightbox__nav--next"
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            <Icon name="chevron-right" size={26} strokeWidth={1.75} />
          </button>
        </>
      )}

      <p className="av-lightbox__hint">
        {zoomed ? 'Scroll to look around · tap to zoom out' : 'Tap photo to zoom'}
      </p>
    </div>
  );
}
