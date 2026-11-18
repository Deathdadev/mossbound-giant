import { useState, type RefObject } from "react";
import { ChapterArt, StudioMark } from "./Artwork";
import { Icon } from "./Icon";
import { FILM_URL } from "../film/reel";

export function FilmNotes({
  dialogRef,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"story" | "craft">("story");
  return (
    <dialog
      className="notes-dialog"
      ref={dialogRef}
      aria-labelledby="notes-title"
      onClose={onClose}
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < b.left ||
          e.clientX > b.right ||
          e.clientY < b.top ||
          e.clientY > b.bottom
        )
          dialogRef.current?.close();
      }}
    >
      <div className="notes-top">
        <span className="journal-label">
          <StudioMark small />
          Canopy field journal
        </span>
        <button
          className="close-notes"
          aria-label="Close film notes"
          onClick={() => dialogRef.current?.close()}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="notes-content">
        <p className="eyebrow">
          Production notes <span>/</span> Film 001
        </p>
        <h2 id="notes-title">
          The Mossbound <em>Giant</em>
        </h2>
        <div
          className="note-tabs"
          role="tablist"
          aria-label="Film notes sections"
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
              return;
            e.preventDefault();
            const next =
              e.key === "Home"
                ? "story"
                : e.key === "End"
                  ? "craft"
                  : tab === "story"
                    ? "craft"
                    : "story";
            setTab(next);
            document.getElementById(`${next}-tab`)?.focus();
          }}
        >
          <button
            role="tab"
            id="story-tab"
            tabIndex={tab === "story" ? 0 : -1}
            aria-controls="story-panel"
            aria-selected={tab === "story"}
            onClick={() => setTab("story")}
          >
            The story
          </button>
          <button
            role="tab"
            id="craft-tab"
            tabIndex={tab === "craft" ? 0 : -1}
            aria-controls="craft-panel"
            aria-selected={tab === "craft"}
            onClick={() => setTab("craft")}
          >
            The craft
          </button>
        </div>
        {tab === "story" ? (
          <div
            className="note-body"
            id="story-panel"
            role="tabpanel"
            aria-labelledby="story-tab"
          >
            <div className="journal-plate">
              <ChapterArt chapter={0} />
              <span>
                Fig. 01
                <br />
                <i>Forest regrowth</i>
              </span>
            </div>
            <h3>A forest holding its breath.</h3>
            <p>
              For seasons beyond counting, the guardian has knelt in the
              clearing. Ferns have settled into its armor. A young sapling has
              found a home on its crown.
            </p>
            <p>
              At first light, a bird lands on its shoulder. Something warm
              answers beneath the moss. In one unbroken shot, a relic of another
              age remembers how to rise.
            </p>
          </div>
        ) : (
          <div
            className="note-body"
            id="craft-panel"
            role="tabpanel"
            aria-labelledby="craft-tab"
          >
            <div className="journal-plate">
              <ChapterArt chapter={1} />
              <span>
                Fig. 02
                <br />
                <i>Weathered machinery</i>
              </span>
            </div>
            <h3>One model. A thousand frames.</h3>
            <p>
              Every surface is drawn in code. A fixed volumetric model keeps the
              armor, ink contours, and painted wear consistent as each new pose
              is rendered. No AI image generation is used.
            </p>
            <p>
              The guardian moves on twos, with a new character drawing every two
              frames. Birds, mist, falling earth, and wind continue at 24 frames
              per second. The soundtrack is an original synthesis of woodland
              air and waking machinery.
            </p>
          </div>
        )}
        <dl className="film-specs">
          <div>
            <dt>Running time</dt>
            <dd>42 seconds</dd>
          </div>
          <div>
            <dt>Presentation</dt>
            <dd>
              24 fps <span>/</span> 1,008 frames
            </dd>
          </div>
          <div>
            <dt>Original format</dt>
            <dd>
              1600 &times; 780 <span>/</span> Stereo
            </dd>
          </div>
        </dl>
        <a
          className="download-film"
          href={FILM_URL}
          download="The Mossbound Giant - Canopy Studio.mp4"
        >
          <Icon name="download" size={17} />
          <span>Download the film</span>
          <small>MP4</small>
        </a>
        <p className="keyboard-guide">
          <kbd>Space</kbd> Play / pause <kbd>M</kbd> Sound <kbd>F</kbd>{" "}
          Fullscreen
        </p>
      </div>
    </dialog>
  );
}
