export type IconName =
  | "play"
  | "pause"
  | "volume"
  | "muted"
  | "fullscreen"
  | "cinema"
  | "loop"
  | "close"
  | "arrow"
  | "download"
  | "return"
  | "index"
  | "replay"
  | "check"
  | "notes";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "pause" && (
        <g fill="currentColor" stroke="none">
          <rect x="6.4" y="4.5" width="3.4" height="15" rx=".65" />
          <rect x="14.2" y="4.5" width="3.4" height="15" rx=".65" />
        </g>
      )}
      {name === "play" && (
        <path d="m7.5 4.5 12 7.5-12 7.5z" fill="currentColor" strokeWidth="1" />
      )}
      {(name === "volume" || name === "muted") && (
        <>
          <path d="M3 9h4l5-4v14l-5-4H3z" />
          {name === "volume" ? (
            <>
              <path d="M15.5 8.3q3.9 3.6 0 7.4M18.7 5.2q7 6.7 0 13.6" />
            </>
          ) : (
            <path d="m16 9 6 6m0-6-6 6" />
          )}
        </>
      )}
      {name === "fullscreen" && (
        <path d="M8.5 4H4v4.5M15.5 4H20v4.5M20 15.5V20h-4.5M8.5 20H4v-4.5" />
      )}
      {name === "cinema" && (
        <>
          <rect x="2.8" y="5.8" width="18.4" height="12.4" rx="1.1" />
          <path d="M6 9h3M15 15h3" />
        </>
      )}
      {name === "loop" && (
        <>
          <path d="M4.4 10V8.7A3.7 3.7 0 0 1 8.1 5h10.2m-2.7-2.6L18.5 5l-2.9 2.7M19.6 14v1.3a3.7 3.7 0 0 1-3.7 3.7H5.7m2.7 2.6L5.5 19l2.9-2.7" />
        </>
      )}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
      {name === "arrow" && <path d="M5 12h14m-6-6 6 6-6 6" />}
      {name === "download" && (
        <path d="M12 3v12m-4.5-4.5L12 15l4.5-4.5M4.5 16v4h15v-4" />
      )}
      {name === "return" && <path d="M20 12H4m7-7-7 7 7 7" />}
      {name === "index" && (
        <>
          <path d="M8 6h12M8 12h12M8 18h12" />
          <path d="M3.5 6h.1m-.1 6h.1m-.1 6h.1" strokeWidth="2.4" />
        </>
      )}
      {name === "replay" && (
        <>
          <path d="M4 10a8 8 0 1 1 .7 7M4 4v6h6" />
        </>
      )}
      {name === "check" && <path d="m4.5 12.5 5 5 10-11" />}
      {name === "notes" && (
        <>
          <path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.3 11h7.4m-7.4 3.5h7.4m-7.4 3.4h4" />
        </>
      )}
    </svg>
  );
}
