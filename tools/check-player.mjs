const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
import assert from "node:assert/strict";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.TEST_URL || "http://localhost:5173";
await page.goto(base);
const v = page.locator("video");
await page.waitForFunction(
  () => document.querySelector("video")?.currentTime > 0.3,
);
assert.equal(await v.evaluate((v) => v.duration), 42);
assert.equal(await v.evaluate((v) => v.videoWidth), 1600);
assert.equal(await v.evaluate((v) => v.muted), true);
await page.getByRole("button", { name: "Pause film", exact: true }).click();
let t = await v.evaluate((v) => v.currentTime);
await page.waitForTimeout(250);
assert.equal(t, await v.evaluate((v) => v.currentTime));
await page.getByRole("button", { name: "Turn sound on", exact: true }).click();
assert.equal(await v.evaluate((v) => v.muted), false);
await page.getByRole("button", { name: /Play chapter 2:/ }).click();
await page.waitForTimeout(100);
assert.ok(
  await v.evaluate(
    (v) => v.currentTime >= 15 && v.currentTime < 16 && !v.paused,
  ),
);
await page.getByRole("button", { name: /Play chapter 3:/ }).click();
await page.waitForTimeout(100);
assert.ok(await v.evaluate((v) => v.currentTime >= 29 && v.currentTime < 30));
await page.getByRole("button", { name: "Repeat film", exact: true }).click();
assert.equal(await v.evaluate((v) => v.loop), true);
await page.getByRole("button", { name: "Disable repeat", exact: true }).click();
const range = page.getByRole("slider", { name: "Film timeline" });
let box = await range.boundingBox();
await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
await page.waitForTimeout(100);
assert.ok(
  await v.evaluate(
    (v) => v.currentTime > 20 && v.currentTime < 22 && !v.paused,
  ),
);
await page.getByRole("button", { name: "Film notes", exact: true }).click();
assert.equal(await v.evaluate((v) => v.paused), true);
assert.equal(await page.locator("dialog").evaluate((d) => d.open), true);
await page.getByRole("tab", { name: "The craft", exact: true }).click();
assert.match(
  await page.locator("#craft-panel").innerText(),
  /No AI image generation/,
);
const dl = page.waitForEvent("download");
await page.getByRole("link", { name: /Download the film/ }).click();
const download = await dl;
assert.ok(download.suggestedFilename().endsWith(".mp4"));
await download.delete();
await page.keyboard.press("Escape");
assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
await page.waitForFunction(() => !document.querySelector("video").paused);
assert.equal(await v.evaluate((v) => v.paused), false);
await page.getByRole("button", { name: "Cinema mode", exact: true }).click();
await page.waitForSelector(".cinema-mode");
assert.equal(await page.locator("h1").isVisible(), false);
await page.keyboard.press("Escape");
assert.equal(await page.locator(".cinema-mode").count(), 0);
await page
  .getByRole("button", { name: "Enter fullscreen", exact: true })
  .click();
await page.waitForFunction(() => Boolean(document.fullscreenElement));
await page
  .getByRole("button", { name: "Exit fullscreen", exact: true })
  .click();
await page.waitForFunction(() => !document.fullscreenElement);
await v.evaluate((v) => {
  v.currentTime = 41.8;
  v.play();
});
await page.waitForSelector(".replay-film");
await page.getByRole("button", { name: "Replay film", exact: true }).click();
assert.ok(await v.evaluate((v) => v.currentTime < 1 && !v.paused));
await page.keyboard.press("m");
assert.equal(await v.evaluate((v) => v.muted), true);
for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 850 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert.equal(overflow, false, "Overflow at " + width);
}
const perf = await v.evaluate((v) => ({
  total: v.getVideoPlaybackQuality().totalVideoFrames,
  dropped: v.getVideoPlaybackQuality().droppedVideoFrames,
}));
const reduced = await browser.newPage({
  reducedMotion: "reduce",
  viewport: { width: 390, height: 844 },
});
await reduced.goto(base);
await reduced.waitForTimeout(300);
assert.equal(await reduced.locator("video").evaluate((v) => v.paused), true);
await reduced.getByRole("button", { name: "Play film", exact: true }).click();
await reduced.waitForFunction(
  () => document.querySelector("video").currentTime > 0.1,
);
assert.deepEqual(errors, []);
const report = {
  passed: true,
  checks: [
    "MP4 decoding",
    "42-second duration",
    "autoplay muted",
    "pause/resume",
    "sound toggle",
    "chapter seeking",
    "repeat toggle",
    "pointer scrubbing and resume",
    "modal pause/restore",
    "journal tabs",
    "MP4 download",
    "cinema view",
    "native fullscreen",
    "end/replay",
    "keyboard shortcuts",
    "five responsive widths",
    "reduced-motion preference",
  ],
  playback: perf,
  pageErrors: errors,
};
console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(
  "verification/browser-checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
await browser.close();
