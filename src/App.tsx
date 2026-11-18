import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ChapterArt, StudioMark } from "./components/Artwork";
import { Icon } from "./components/Icon";
import { FilmNotes } from "./components/FilmNotes";
import { CHAPTERS, DURATION, FILM_URL, timecode } from "./film/reel";

export default function App() {
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLElement>(null);
  const notes = useRef<HTMLDialogElement>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeNotes = useRef(false);
  const resumeScrub = useRef(false);
  const autoplay = useRef(
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(autoplay.current);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(false);
  const [cinema, setCinema] = useState(false);
  const [full, setFull] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [error, setError] = useState(false);
  const chapter = time >= 29 ? 2 : time >= 15 ? 1 : 0;
  const ended = time >= DURATION - 0.04 && !playing;
  const immersive = cinema || full;
  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.ended || v.currentTime >= DURATION - 0.03) v.currentTime = 0;
    void v.play().catch(() => setPlaying(false));
  }, []);
  const togglePlay = useCallback(() => {
    if (video.current?.paused) play();
    else video.current?.pause();
  }, [play]);
  const seek = useCallback(
    (value: number, start = false) => {
      if (!video.current || !Number.isFinite(value)) return;
      const next = Math.max(0, Math.min(DURATION, value));
      video.current.currentTime = next;
      setTime(next);
      if (start) play();
    },
    [play],
  );
  const reveal = useCallback(() => {
    setUiVisible(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setUiVisible(false), 2800);
  }, []);
  const sound = useCallback(() => {
    if (video.current) {
      video.current.muted = !video.current.muted;
      setMuted(video.current.muted);
    }
  }, []);
  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.current?.requestFullscreen)
        await stage.current.requestFullscreen();
      else setCinema((v) => !v);
    } catch {
      setCinema((v) => !v);
    }
    reveal();
  }, [reveal]);
  const exitCinema = useCallback(() => {
    setCinema(false);
    setUiVisible(true);
    if (document.fullscreenElement) void document.exitFullscreen();
  }, []);
  const openNotes = () => {
    if (!notes.current || notes.current.open) return;
    resumeNotes.current = !!video.current && !video.current.paused;
    video.current?.pause();
    setNotesOpen(true);
    notes.current.showModal();
  };
  const closeNotes = () => {
    setNotesOpen(false);
    if (resumeNotes.current) play();
    resumeNotes.current = false;
  };
  useEffect(() => {
    if (video.current) {
      video.current.volume = 0.8;
      if (autoplay.current)
        void video.current.play().catch(() => setPlaying(false));
    }
    const onFull = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      document.removeEventListener("fullscreenchange", onFull);
      clearTimeout(idle.current);
    };
  }, []);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", cinema || notesOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [cinema, notesOpen]);
  useEffect(() => {
    if (immersive) reveal();
  }, [immersive, reveal]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (notes.current?.open || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = (e.target as HTMLElement).tagName;
      if (e.key === "Escape") exitCinema();
      if (target === "INPUT" || target === "TEXTAREA") return;
      if (e.code === "Space" && !["BUTTON", "A"].includes(target)) {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === "m") sound();
      if (e.key.toLowerCase() === "f") void fullscreen();
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        seek(
          (video.current?.currentTime || 0) + (e.key === "ArrowLeft" ? -5 : 5),
        );
      }
      reveal();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [exitCinema, reveal, seek, fullscreen, sound, togglePlay]);
  const finishScrub = () => {
    if (resumeScrub.current) play();
    resumeScrub.current = false;
  };

  return (
    <div className="screening-room">
      <header className="site-header" inert={cinema}>
        <a
          className="wordmark"
          href="#screening-room"
          aria-label="Canopy Studio screening room"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <StudioMark />
          <span className="brand-name">Canopy</span>
          <span className="brand-studio">
            Animation
            <br />
            Studio
          </span>
        </a>
        <nav className="main-nav" aria-label="Studio navigation">
          <a className="nav-current" href="#screening-room">
            <span className="nav-dot" />
            Screening room
          </a>
          <button onClick={openNotes}>
            Film notes
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 9 9 3M3.5 3H9v5.5"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
          </button>
        </nav>
        <button
          className="cinema-button"
          aria-label="Cinema mode"
          onClick={() => {
            setCinema(true);
            reveal();
          }}
        >
          <Icon name="cinema" size={17} />
          <span>Cinema mode</span>
        </button>
      </header>
      <main>
        <section
          id="screening-room"
          ref={stage}
          className={`film-stage ${cinema ? "cinema-mode" : ""} ${immersive ? "immersive" : ""} ${immersive && !uiVisible && playing ? "ui-hidden" : ""}`}
          aria-label="The Mossbound Giant film player"
          onPointerMove={immersive ? reveal : undefined}
          onFocusCapture={immersive ? reveal : undefined}
        >
          <video
            ref={video}
            className="film-image"
            src={FILM_URL}
            poster="/film/poster.jpg"
            playsInline
            disableRemotePlayback
            disablePictureInPicture
            controlsList="noremoteplayback"
            autoPlay={autoplay.current}
            muted={muted}
            loop={loop}
            preload="auto"
            aria-label="The Mossbound Giant, an original 42-second animated forest film"
            aria-describedby="film-description"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={() => setError(false)}
            onError={() => {
              setError(true);
              setPlaying(false);
            }}
            onEnded={() => {
              setTime(DURATION);
              setPlaying(false);
            }}
            onClick={() => {
              togglePlay();
              reveal();
            }}
            onDoubleClick={() => void fullscreen()}
          >
            <track
              kind="captions"
              src="/film/forest-sounds.vtt"
              srcLang="en"
              label="Ambient sound descriptions"
            />
          </video>
          <div className="film-wash" aria-hidden="true" />
          <div className="film-intro">
            <div className="film-kicker">
              <span />A Canopy original
              <i />
              Film 001
            </div>
            <h1>
              The Mossbound
              <br />
              <em>Giant</em>
            </h1>
            <p>An ancient guardian stirs in a forest of gold.</p>
          </div>
          <p id="film-description" className="sr-only">
            In a sunlit woodland, a bird settles on a moss-covered robot. Its
            amber chest light pulses. The giant rises, shedding roots and earth,
            then launches through the canopy as leaves spiral in its wake.
          </p>
          {immersive && (
            <div className="cinema-header">
              <button onClick={exitCinema}>
                <Icon name="return" size={17} />
                Exit cinema
              </button>
              <span>The Mossbound Giant</span>
            </div>
          )}
          {error && (
            <div className="media-error" role="alert">
              <p>The film could not be loaded.</p>
              <button
                onClick={() => {
                  setError(false);
                  video.current?.load();
                  play();
                }}
              >
                Retry playback <Icon name="replay" size={15} />
              </button>
              <a href={FILM_URL} download>
                Download the MP4
              </a>
            </div>
          )}
          {ended && !error && (
            <button className="replay-film" onClick={() => seek(0, true)}>
              <Icon name="replay" size={17} />
              Replay film
            </button>
          )}
          <div className="player-controls">
            <div
              className="timeline"
              style={
                { "--progress": `${(time / DURATION) * 100}%` } as CSSProperties
              }
            >
              <div className="timeline-track">
                <span className="timeline-elapsed" />
                <i style={{ left: `${(15 / 42) * 100}%` }} />
                <i style={{ left: `${(29 / 42) * 100}%` }} />
                <b className="playhead" />
              </div>
              <input
                type="range"
                min="0"
                max={DURATION}
                step={1 / 24}
                value={Math.min(DURATION, time)}
                aria-label="Film timeline"
                aria-valuetext={`${timecode(time)} of 00:42, ${CHAPTERS[chapter].name}`}
                onChange={(e) => seek(Number(e.target.value))}
                onPointerDown={(e) => {
                  resumeScrub.current =
                    !!video.current && !video.current.paused;
                  video.current?.pause();
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerUp={finishScrub}
                onPointerCancel={finishScrub}
              />
            </div>
            <div className="control-row">
              <div className="control-group left-controls">
                <button
                  className="icon-button play-button"
                  title={playing ? "Pause (Space)" : "Play (Space)"}
                  aria-label={playing ? "Pause film" : "Play film"}
                  onClick={togglePlay}
                >
                  <Icon
                    name={ended ? "replay" : playing ? "pause" : "play"}
                    size={18}
                  />
                </button>
                <button
                  className="icon-button sound-button"
                  title={muted ? "Turn sound on (M)" : "Mute sound (M)"}
                  aria-label={muted ? "Turn sound on" : "Mute sound"}
                  aria-pressed={!muted}
                  onClick={sound}
                >
                  <Icon name={muted ? "muted" : "volume"} size={18} />
                </button>
                <div className="timecode">
                  {timecode(time)}
                  <span>/</span>
                  <span>00:42</span>
                </div>
                <span className="control-divider" />
                <span className="current-act">
                  Act {CHAPTERS[chapter].roman}
                  <i />
                  {CHAPTERS[chapter].name}
                </span>
              </div>
              <div className="control-group right-controls">
                <span className="frame-rate">24 FPS</span>
                <span className="control-divider" />
                <button
                  title={loop ? "Disable repeat" : "Repeat film"}
                  aria-label={loop ? "Disable repeat" : "Repeat film"}
                  aria-pressed={loop}
                  className={`icon-button loop-button ${loop ? "enabled" : ""}`}
                  onClick={() => setLoop(!loop)}
                >
                  <Icon name="loop" size={17} />
                </button>
                <button
                  className="icon-button"
                  title="Fullscreen (F)"
                  aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
                  onClick={() => void fullscreen()}
                >
                  <Icon name="fullscreen" size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section
          className="chapters"
          aria-labelledby="chapters-title"
          inert={cinema}
        >
          <div className="chapter-heading">
            <h2 id="chapters-title">Scene chapters</h2>
            <span className="index-caption">
              <span className="caption-rule" />
              One film, three movements
            </span>
          </div>
          <div className="chapter-list">
            {CHAPTERS.map((act, i) => (
              <button
                key={act.name}
                className={`chapter ${i === chapter ? "active" : ""}`}
                onClick={() => seek(act.start, true)}
                aria-label={`Play chapter ${i + 1}: ${act.name}, ${timecode(act.start)}`}
                aria-current={i === chapter ? "step" : undefined}
              >
                <ChapterArt chapter={i} />
                <span className="chapter-copy">
                  <span className="chapter-meta">
                    Act {act.roman}
                    <i />
                    {timecode(act.start)}
                    <span className="time-dash">&ndash;</span>
                    {timecode(act.end)}
                  </span>
                  <span className="chapter-title">{act.name}</span>
                  <span className="chapter-description">{act.line}</span>
                </span>
                <span
                  className={`chapter-action ${i === chapter && playing ? "is-playing" : ""}`}
                  aria-hidden="true"
                >
                  {i === chapter && playing ? (
                    <span className="equalizer">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <Icon name="play" size={12} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer" inert={cinema}>
        <span>
          <span className="footer-dot" />
          An independent animation study
        </span>
        <button onClick={openNotes}>
          Production notes <Icon name="arrow" size={14} />
        </button>
      </footer>
      <FilmNotes dialogRef={notes} onClose={closeNotes} />
    </div>
  );
}
