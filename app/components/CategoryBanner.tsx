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
    image: '/images/lehenga.jpg',
    description: 'Bridal & Festive Collection',
  },
  {
    id: '2',
    title: 'Anarkali Suits',
    handle: 'anarkali',
    image: '/images/anarkali.jpg',
    description: 'Elegant Traditional Wear',
  },
  {
    id: '3',
    title: 'Designer Kurtis',
    handle: 'kurtis',
    image: '/images/kurti.jpg',
    description: 'Contemporary Ethnic Style',
  },
  {
    id: '4',
    title: 'Co-ord Sets',
    handle: 'co-ords',
    image: '/images/coord.jpg',
    description: 'Modern Fusion Wear',
  },
  {
    id: '5',
    title: 'Sarees',
    handle: 'sarees',
    image: '/images/lehenga.jpg',
    description: 'Timeless Elegance',
  },
];

export function CategoryBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = CATEGORY_SLIDES.length;

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // 4 seconds per slide

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
    // Resume auto-play after 8 seconds of manual interaction
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

  return (
    <section className="av-category-banner" aria-label="Product categories carousel">
      <div className="av-category-banner__container">
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
                  loading={index <= 1 ? 'eager' : 'lazy'}
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
