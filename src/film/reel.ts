export const DURATION = 42;
export const FPS = 24;
export const CHAPTERS = [
  {
    name: "Awakening",
    start: 0,
    end: 15,
    line: "A pulse beneath the moss.",
    roman: "I",
  },
  {
    name: "The Stand",
    start: 15,
    end: 29,
    line: "The weight of a thousand seasons.",
    roman: "II",
  },
  {
    name: "The Launch",
    start: 29,
    end: 42,
    line: "An opening in the canopy.",
    roman: "III",
  },
] as const;
export const FILM_URL = "film/the-mossbound-giant.mp4";
export const timecode = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
