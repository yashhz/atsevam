/**
 * ATSEVAM — Reusable VideoSection Component
 *
 * Usage (homepage, any page):
 *   <VideoSection
 *     headline="Crafted with Love"
 *     description="Every piece tells a story..."
 *     stats={[...]}
 *     videos={[...]}
 *   />
 *
 * Default values come from the Atsevam brand defaults so it can be
 * dropped in with zero props.
 */

import {useState, useRef} from 'react';
import {Icon} from '~/components/ui/Icon';

type VideoStat = {
  number: string;
  label: string;
};

type VideoItem = {
  src: string;
  poster?: string;
  caption: string;
};

type VideoSectionProps = {
  headline?: string;
  description?: string | string[];
  stats?: VideoStat[];
  videos?: VideoItem[];
  eyebrow?: string;
};

const DEFAULT_STATS: VideoStat[] = [
  {number: '5,000+', label: 'Artisans'},
  {number: '100%',   label: 'Handcrafted'},
  {number: '50+',    label: 'Years Legacy'},
];

const DEFAULT_VIDEOS: VideoItem[] = [
  {src: '/videos/bts.mp4',           poster: '/images/lehenga.jpg',  caption: 'Behind the Scenes'},
  {src: '/videos/craftsmanship.mp4', poster: '/images/anarkali.jpg', caption: 'The Art of Embroidery'},
];

const DEFAULT_DESC = [
  'Every piece at Atsevam tells a story of tradition, artistry, and dedication. Watch our skilled artisans bring each design to life using time-honored techniques passed down through generations.',
  'From intricate embroidery to delicate zari work, every stitch is a testament to the craftsmanship that makes our ethnic wear truly special.',
];

// ─── Video player with play button overlay ─────────────────────────

function VideoPlayer({video}: {video: VideoItem}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="av-video-player">
      <div className="av-video-player__wrapper" onClick={toggle}>
        <video
          ref={videoRef}
          className="av-video-player__video"
          poster={video.poster}
          preload="metadata"
          playsInline
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          aria-label={video.caption}
        >
          <source src={video.src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Play / Pause overlay */}
        <button
          className={`av-video-player__play-btn${playing ? ' av-video-player__play-btn--playing' : ''}`}
          aria-label={playing ? 'Pause video' : 'Play video'}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
        >
          <Icon
            name={playing ? 'close' : 'play'}
            size={26}
            strokeWidth={1.5}
          />
        </button>
      </div>
      <p className="av-video-player__caption">{video.caption}</p>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────

export function VideoSection({
  headline = 'Crafted with Love',
  description = DEFAULT_DESC,
  stats = DEFAULT_STATS,
  videos = DEFAULT_VIDEOS,
  eyebrow = 'Our Story',
}: VideoSectionProps) {
  const descriptions = Array.isArray(description) ? description : [description];

  return (
    <section className="av-video-section section">
      <div className="container">
        <div className="av-video-section__layout">

          {/* Left: Text content */}
          <div className="av-video-section__text">
            {eyebrow && (
              <p className="av-video-section__eyebrow">{eyebrow}</p>
            )}
            <h2 className="av-video-section__headline">{headline}</h2>

            {descriptions.map((para, i) => (
              <p key={i} className="av-video-section__description">{para}</p>
            ))}

            {stats.length > 0 && (
              <div className="av-video-section__stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="av-video-stat">
                    <span className="av-video-stat__number">{stat.number}</span>
                    <span className="av-video-stat__label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Video players */}
          <div className="av-video-section__videos">
            {videos.map((video, i) => (
              <VideoPlayer key={i} video={video} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
