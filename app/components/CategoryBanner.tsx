import {Link} from 'react-router';
import {useState, useEffect, useRef} from 'react';
import {Icon} from '~/components/ui/Icon';

type CategorySlide = {
  id: string;
  title: string;
  handle: string;
  image: string;
  description: string;
};

const CATEGORY_SLIDES: CategorySlide[] = [
  {
    id: '1',
    title: 'Lehengas',
    handle: 'lehengas',
    image: '/images/homepage/lehenga.jpeg',
    description: 'Bridal & Festive Collection',
  },
  {
    id: '2',
    title: 'Anarkali Suits',
    handle: 'anarkali',
    image: '/images/homepage/anarkali1.jpeg',
    description: 'Elegant Traditional Wear',
  },
  {
    id: '3',
    title: 'Designer Kurtis',
    handle: 'kurtis',
    image: '/images/homepage/kurti.jpeg',
    description: 'Contemporary Ethnic Style',
  },
  {
    id: '4',
    title: 'Co-ord Sets',
    handle: 'co-ords',
    image: '/images/homepage/co ord set.jpeg',
    description: 'Modern Fusion Wear',
  },
  {
    id: '5',
    title: 'Traditional Sarees',
    handle: 'sarees',
    image: '/images/homepage/1 (3).jpeg',
    description: 'Timeless Elegance & Grace',
  },
  {
    id: '6',
    title: 'Navratri Special',
    handle: 'navratri-lehenga-choli',
    image: '/images/homepage/lehenga choli.jpeg',
    description: 'Vibrant Festive Collection',
  },
  {
    id: '7',
    title: 'Western Wear',
    handle: 'western-dresses',
    image: '/images/homepage/1 (7).jpeg',
    description: 'Modern Silhouettes, Classic Craft',
  },
  {
    id: '8',
    title: 'New Arrivals',
    handle: 'new-arrivals',
    image: '/images/homepage/1 (8).jpeg',
    description: 'Fresh Runway Handcrafts',
  },
];

export function CategoryBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe states for Myntra/Ajio mobile responsive feel
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalSlides = CATEGORY_SLIDES.length;

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4500); // 4.5 seconds per slide

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentSlide, isAutoPlaying, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after manual interaction
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  // Swipe handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section className="av-category-banner" aria-label="Product categories carousel">
      <div 
        className="av-category-banner__container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div className="av-category-banner__slides" role="region" aria-live="polite">
          {CATEGORY_SLIDES.map((slide, index) => (
            <Link
              key={slide.id}
              to={`/collections/${slide.handle}`}
              className={`av-category-banner__slide${
                index === currentSlide ? ' av-category-banner__slide--active' : ''
              }`}
              style={{
                transform: `translateX(${(index - currentSlide) * 100}%)`,
              }}
              aria-hidden={index !== currentSlide}
              tabIndex={index === currentSlide ? 0 : -1}
            >
              <div className="av-category-banner__image-wrap">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="av-category-banner__image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <div className="av-category-banner__overlay" />
              </div>
              <div className="av-category-banner__content">
                <h2 className="av-category-banner__title">{slide.title}</h2>
                <p className="av-category-banner__description">{slide.description}</p>
                <span className="av-category-banner__cta">
                  Shop Now <Icon name="arrow-right" size={18} strokeWidth={2} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          className="av-category-banner__arrow av-category-banner__arrow--prev"
          onClick={prevSlide}
          aria-label="Previous category"
        >
          <Icon name="chevron-left" size={24} strokeWidth={2} />
        </button>
        <button
          className="av-category-banner__arrow av-category-banner__arrow--next"
          onClick={nextSlide}
          aria-label="Next category"
        >
          <Icon name="chevron-right" size={24} strokeWidth={2} />
        </button>

        {/* Dots Indicator */}
        <div className="av-category-banner__dots">
          {CATEGORY_SLIDES.map((_, index) => (
            <button
              key={index}
              className={`av-category-banner__dot${
                index === currentSlide ? ' av-category-banner__dot--active' : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
