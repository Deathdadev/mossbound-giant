// Render every cel offline. Encoding never depends on real-time browser performance.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const out = "public/film";
await mkdir(out, { recursive: true });
try {
  await page.route("**/__film-renderer", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Film renderer</title>",
    }),
  );
  await page.goto(
    `${process.env.STUDIO_URL || "http://localhost:5173"}/__film-renderer`,
  );
  await page.evaluate(async () => {
    const { ForestFilm } = await import("/src/film/scene.ts");
    window.rendering = new ForestFilm(document.createElement("canvas"));
  });
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "image2pipe",
    "-framerate",
    "24",
    "-vcodec",
    "mjpeg",
    "-i",
    "pipe:0",
  ];
  if (process.env.SOUNDTRACK)
    args.push("-i", process.env.SOUNDTRACK, "-c:a", "aac", "-b:a", "160k");
  args.push(
    "-vf",
    "hqdn3d=1.2:1.1:1.5:1.4,scale=in_range=full:out_range=tv:out_color_matrix=bt709",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-g",
    "48",
    "-pix_fmt",
    "yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-movflags",
    "+faststart",
    "-metadata",
    "title=The Mossbound Giant",
    "-metadata",
    "artist=Canopy Studio",
    `${out}/the-mossbound-giant.mp4`,
  );
  const encoder = spawn(process.env.FFMPEG || "ffmpeg", args, {
    stdio: ["pipe", "inherit", "inherit"],
  });
  const finished = once(encoder, "close");
  for (let frame = 0; frame < 1008; frame++) {
    const encoded = await page.evaluate((f) => {
      window.rendering.draw((f + 0.00001) / 24);
      return window.rendering.canvas
        .toDataURL("image/jpeg", 0.96)
        .split(",")[1];
    }, frame);
    const bytes = Buffer.from(encoded, "base64");
    if (frame === 88) await writeFile(`${out}/poster.jpg`, bytes);
    if (!encoder.stdin.write(bytes)) await once(encoder.stdin, "drain");
    if (frame % 120 === 0) console.log(`Rendered ${frame} / 1008 frames`);
  }
  encoder.stdin.end();
  const [code] = await finished;
  if (code !== 0) throw new Error(`Video encoder exited with ${code}`);
  console.log("Complete: 1,008 frames, 24 fps, 42 seconds.");
} finally {
  await browser.close();
}
