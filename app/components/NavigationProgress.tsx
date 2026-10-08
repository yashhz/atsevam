import {useEffect, useState} from 'react';
import {useNavigation} from 'react-router';

/**
 * Thin brand-coloured bar at the very top that runs while a page navigation is
 * loading. Gives instant feedback on slow mobile networks so a tap on a product
 * never feels like it did nothing.
 */
export function NavigationProgress() {
  const navigation = useNavigation();
  const loading = navigation.state !== 'idle';
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    if (loading) {
      setPhase('running');
      return;
    }
    setPhase((prev) => (prev === 'running' ? 'done' : prev));
    const t = setTimeout(() => setPhase('idle'), 350);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div
      className={`av-nav-progress av-nav-progress--${phase}`}
      role="progressbar"
      aria-hidden={phase === 'idle'}
      aria-label="Loading page"
    />
  );
}
