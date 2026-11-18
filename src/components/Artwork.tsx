import { useId } from "react";

export function StudioMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "studio-mark small" : "studio-mark"}
      viewBox="0 0 50 47"
      fill="none"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path d="M24.3 3.2 18.8 12l3.7-1.1-7.7 10.8 5.3-1.5-8.3 10.3 7.7-2.2-6.1 7.4 11.1-2.5 9.6 2.1-5.5-7.2 6.8 1.5-8.1-9.8 4.8 1.4-7.1-10 3.4 1.2z" />
        <path d="m9.8 16.6-4.1 7 2.9-.9L2.9 31l4.1-1.4L1.8 36l8.1-2 6.1 1.1-4-5.6 3.6.7-5.1-7.9 2.8 1zM38 9.2l-4 7.4 2.8-.9-6.1 9.1 4.1-1.5-6 8.2 8.6-2.1 8.4 2.4-6.1-8.9 4.5 1.4-5.9-8.4 3.2.9z" />
      </g>
      <g stroke="currentColor" strokeLinecap="round">
        <path d="M24 26v15m-14-9v9m28-14v11" strokeWidth="2.2" />
        <path
          d="M2 42c11 .3 22-6.6 29-5.4 5 .7 8-.7 16-1.2M8 45c10-1 16-5.9 27-5.8l10-.9"
          strokeWidth="1.3"
        />
      </g>
    </svg>
  );
}

export function ChapterArt({ chapter }: { chapter: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`chapter-art art-${chapter}`}
      viewBox="0 0 96 84"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`h-${id}`}
          patternUnits="userSpaceOnUse"
          width="3.3"
          height="3.3"
          patternTransform="rotate(29)"
        >
          <path
            d="M0 0v4"
            stroke="currentColor"
            strokeWidth=".7"
            opacity=".5"
          />
        </pattern>
      </defs>
      {chapter === 0 && (
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M21 73C33 63 46 44 57 12M24 70C25 54 25 43 18 29M32 64C48 57 61 45 71 29"
            strokeWidth="1.65"
          />
          {Array.from({ length: 10 }, (_, i) => {
            const t = i / 10,
              x = 29 + t * 26,
              y = 63 - t * 45,
              s = 1.05 - t * 0.65;
            return (
              <g
                key={i}
                transform={`translate(${x} ${y}) rotate(${t * -11}) scale(${s})`}
              >
                <path
                  d="M0 0C-5-1-10-6-11-12c4 1 6 4 8 5l-2-5C.4-8 .1-4 0 0Z"
                  fill={`url(#h-${id})`}
                  strokeWidth="1.2"
                />
                <path
                  d="M1-1c3-7 9-10 15-11-1 3-4 5-5 6l5-1C12-2 5-1 1-1Z"
                  fill={`url(#h-${id})`}
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
          {Array.from({ length: 6 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${25 - i * 0.98} ${57 - i * 4.4}) rotate(-28) scale(${0.62 - i * 0.052})`}
            >
              <path
                d="M0 0Q-8-2-11-13Q-2-9 0 0Zm1-3q4-9 12-11Q10-5 1-3Z"
                fill={`url(#h-${id})`}
                strokeWidth="1.4"
              />
            </g>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${43 + i * 3.9} ${56 - i * 3.7}) rotate(23) scale(${0.62 - i * 0.037})`}
            >
              <path
                d="M0 0Q-7-6-7-14Q-1-11 0 0Zm1-3q5-7 15-7Q10-2 1-3Z"
                fill={`url(#h-${id})`}
                strokeWidth="1.4"
              />
            </g>
          ))}
          <path d="m18 75 10-3m29-58 2-6-5 6m16 17 5-5" strokeWidth="1.1" />
        </g>
      )}
      {chapter === 1 && (
        <g stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
          <g transform="translate(47 42) rotate(-24)">
            <path
              d="m-14-20 7-7 7 1 5-4 9 3 1 5 8 5-1 5 5 7-3 8-5 2-4 8-7 1-8 5-7-4-6 1-5-8-5-4 2-7-3-6 6-7z"
              fill={`url(#h-${id})`}
              strokeWidth="1.5"
            />
            <ellipse
              rx="21"
              ry="23"
              transform="translate(1 -1)"
              fill="var(--paper)"
              strokeWidth="1.6"
            />
            <ellipse
              rx="16.5"
              ry="18"
              transform="translate(1 -1)"
              strokeWidth="1"
            />
            <ellipse
              rx="11.7"
              ry="13.6"
              transform="translate(1 -1)"
              fill={`url(#h-${id})`}
              strokeWidth="1.8"
            />
            <ellipse
              rx="7"
              ry="8.6"
              transform="translate(1 -1)"
              strokeWidth=".8"
            />
            <path
              d="m-10-18 2 4 2 2m14 25-2-3 1-2m10-11-3 2-2-1m-27 3 3-.8"
              strokeWidth="1"
            />
          </g>
          <path
            d="M11 66c9-4 14-6 19-4m28 1c3 2 10 1 17-2M14 70c7-1 15-5 23-2m22-1 18-3M31 25c2-8 1-11-5-16m7 14c4-7 7-9 13-12"
            strokeWidth="1.2"
          />
          <path
            d="M28 14q-7-1-9-8 8 0 9 8Zm9 3q2-8 11-9-3 7-11 9Zm-6 4q-7-2-11-6 8-1 11 6Z"
            fill={`url(#h-${id})`}
          />
          <path
            d="m66 59 2-8 1 6 6-7-3 10m-49 3-4-6 1 6-7-3m57 10 7-2m-50 4 5-1"
            strokeWidth="1.1"
          />
        </g>
      )}
      {chapter === 2 && (
        <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M35 48C27 37 16 21 10 14c8 4 18 8 25 15l-5-12c9 8 15 19 17 27"
            fill={`url(#h-${id})`}
            strokeWidth="1.3"
          />
          <path
            d="M41 46C43 29 50 15 68 5c-3 7-6 13-11 18l9-5c-2 5-6 9-11 12l8-3c-2 5-5 8-12 12l7-2c-2 7-7 11-15 14"
            fill={`url(#h-${id})`}
            strokeWidth="1.5"
          />
          <path
            d="M18 65c6-7 13-14 21-19 4-3 9-4 13-3 10-1 16-7 23-7 6 0 9 2 9 5l7 1-8 3c-2 5-10 8-19 9-7 5-14 7-26 6l-16 11 1-5-10 3z"
            fill="var(--paper)"
            strokeWidth="1.4"
          />
          <path
            d="M29 58c8-5 17-10 23-12 8-1 13-2 19-6m-36 18c10-1 21-5 29-9m-35 8-11 9m24-13-17 11m24-19c-1-10 6-21 13-30M35 43c-6-11-10-15-18-22"
            strokeWidth=".8"
          />
          <path
            d="M74 40q5-2 8 1-2 4-8 2z"
            fill={`url(#h-${id})`}
            strokeWidth=".8"
          />
          <circle
            cx="79.5"
            cy="40.2"
            r="1.2"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M10 70 3 73m19 1-10 4m6-23-9 4"
            strokeWidth=".8"
            opacity=".5"
          />
        </g>
      )}
    </svg>
  );
}
