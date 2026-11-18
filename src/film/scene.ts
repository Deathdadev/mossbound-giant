import {
  clamp,
  leaf,
  oval,
  random,
  smooth,
  stroke,
  TAU,
  type Ctx,
} from "./drawing";
import { getForest, HEIGHT, livingForest, WIDTH } from "./forest";
import { Guardian } from "./guardian";
import { DURATION, FPS } from "./reel";

function position(t: number) {
  const age = Math.max(0, t - 32.25),
    flight = 1 - Math.exp(-age * age * 0.43);
  return {
    x:
      1060 +
      290 * flight -
      104 * flight * flight +
      Math.sin(flight * Math.PI) * 23,
    y: 704 - 646 * flight - age * 6.9,
    scale: (1.115 - smooth(15.6, 26.7, t) * 0.17) / (1 + age * age * 0.57),
  };
}

function bird(
  c: Ctx,
  x: number,
  y: number,
  size: number,
  flap: number,
  perched = false,
  reverse = false,
) {
  c.save();
  c.translate(x, y);
  c.scale(reverse ? -size : size, size);
  if (!perched) c.rotate(-0.09 + Math.sin(flap) * 0.05);
  const f = Math.sin(flap);
  if (!perched) {
    c.fillStyle = "#646b54";
    c.beginPath();
    c.moveTo(-1.7, -1.6);
    c.quadraticCurveTo(-7, -4 - f * 8, -12, -2 - f * 14);
    c.quadraticCurveTo(-3, -7 - f * 5, 1.9, -1.3);
    c.fill();
  }
  c.fillStyle = "#405447";
  c.beginPath();
  c.moveTo(-5, -0.3);
  c.lineTo(-11, -3.8);
  c.lineTo(-9.4, 0.8);
  c.lineTo(-4, 2.2);
  c.fill();
  oval(c, -0.5, 0.1, 6.3, 3.9, "#69775b", -0.25);
  oval(c, 0.5, 1.1, 4.5, 2.8, "#bebc8d", -0.23);
  oval(c, 4.3, -3.4, 3.5, 3.4, "#526754");
  oval(c, 5.1, -3.4, 2, 2.1, "#d6ca94");
  oval(c, 5.65, -4.2, 0.75, 0.83, "#273e33");
  c.fillStyle = "#9e8b5e";
  c.beginPath();
  c.moveTo(7.25, -4.5);
  c.lineTo(11.1, -3.5);
  c.lineTo(7.05, -2.65);
  c.fill();
  c.fillStyle = "#465d4a";
  c.beginPath();
  c.moveTo(2, -2.4);
  if (perched) {
    c.quadraticCurveTo(-4, -2, -7, 1.1);
    c.quadraticCurveTo(-2, 2.8, 2, -2.4);
  } else {
    c.quadraticCurveTo(-3, -4 - 8 * f, -9, -3 - 15 * f);
    c.lineTo(-5.8, -3 - 12 * f);
    c.lineTo(-7.2, -2 - 10 * f);
    c.quadraticCurveTo(-1.7, -0.7 - f * 5, 2, -2.4);
  }
  c.fill();
  if (perched) {
    stroke(c, -0.8, 3.4, -1.4, 6.5, "#655e43", 0.7);
    stroke(c, 1.5, 2.8, 1.1, 6.4, "#655e43", 0.7);
    stroke(c, -2.6, 6.5, 0.2, 6.5, "#655e43", 0.6);
  }
  c.restore();
}

const particles = (() => {
  const r = random(8832);
  return Array.from({ length: 168 }, (_, i) => ({
    x: r() * WIDTH,
    y: r() * HEIGHT,
    phase: r() * TAU,
    speed: 0.35 + r() * 0.89,
    size: 0.65 + r() * 2.6,
    type: i % 8,
    birth: 15.8 + r() * 10.7,
    dx: (r() - 0.5) * 177,
    dy: -r() * 44,
    color: ["#849152", "#9c9d61", "#637849", "#b6ae6a", "#6f7051"][i % 5],
  }));
})();

export class ForestFilm {
  readonly canvas: HTMLCanvasElement;
  readonly c: Ctx;
  readonly forest = getForest();
  readonly guardian = new Guardian();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.c = canvas.getContext("2d", { alpha: false })!;
  }

  draw(time: number) {
    const t = Math.floor(clamp(time, 0, DURATION) * FPS) / FPS,
      c = this.c;
    const pos = position(t),
      age = Math.max(0, t - 32.25);
    const rumble =
      smooth(14.7, 16.3, t) * (1 - smooth(17.1, 19.2, t)) * 0.95 +
      smooth(30.1, 32.1, t) * (1 - smooth(32.4, 33.6, t)) * 1.75;
    const shake = Math.sin(t * 31) * rumble,
      sway = Math.sin(t * 0.083) * 2.2;
    const gust = age > 0 ? Math.sin(age * 5.4) * Math.exp(-age * 0.72) : 0;
    c.save();
    c.translate(shake, Math.sin(t * 37) * rumble * 0.55);
    c.drawImage(
      this.forest.back,
      -3.5 + sway * 0.45,
      -2.8,
      WIDTH + 7,
      HEIGHT + 6,
    );
    livingForest(c, t, gust, false);
    for (let i = 0; i < 8; i++) {
      const xx = ((t * (3 + i * 0.81) + i * 237) % 2100) - 230,
        yy = 417 + i * 28 + Math.sin(t * 0.16 + i) * 5;
      c.save();
      c.translate(xx, yy);
      c.scale(1, 0.075 + i * 0.003);
      const haze = c.createRadialGradient(0, 0, 5, 0, 0, 263);
      haze.addColorStop(0, `rgba(240,232,199,${0.108 - i * 0.005})`);
      haze.addColorStop(0.53, "rgba(236,230,198,.065)");
      haze.addColorStop(1, "rgba(239,231,200,0)");
      c.fillStyle = haze;
      c.fillRect(-263, -263, 526, 526);
      c.restore();
    }
    const shadowStrength = 1 - smooth(32.25, 34.5, t);
    if (shadowStrength > 0) {
      c.save();
      c.translate(1042, 699);
      c.scale(1, 0.17);
      const sh = c.createRadialGradient(0, 0, 29, 0, 0, 266);
      sh.addColorStop(0, `rgba(33,48,33,${0.51 * shadowStrength})`);
      sh.addColorStop(0.59, `rgba(40,52,35,${0.25 * shadowStrength})`);
      sh.addColorStop(1, "rgba(45,54,40,0)");
      c.fillStyle = sh;
      c.fillRect(-266, -266, 532, 532);
      c.restore();
    }
    const robot = this.guardian.draw(t),
      ink = this.guardian.ink;
    if (shadowStrength > 0) {
      c.save();
      c.translate(1060, 704);
      c.transform(1, 0.015, 0.44, 0.105, 0, 0);
      c.globalAlpha = 0.23 * shadowStrength;
      c.filter = "brightness(0)";
      c.drawImage(
        robot,
        -ink.originX * pos.scale,
        -ink.originY * pos.scale,
        robot.width * pos.scale,
        robot.height * pos.scale,
      );
      c.restore();
    }
    if (t >= 30.2) {
      const power = smooth(30.2, 32.36, t);
      for (let nozzle = 0; nozzle < 2; nozzle++) {
        const n = this.guardian.nozzles[nozzle],
          xx = pos.x + (n[0] - ink.originX) * pos.scale,
          yy = pos.y + (n[1] - ink.originY) * pos.scale;
        const plume = (39 + 159 * power + Math.sin(t * 31) * 13) * pos.scale;
        for (let k = 0; k < 3; k++) {
          const w = (23 - k * 5) * power * pos.scale,
            h = plume * (1 - k * 0.21);
          c.fillStyle = ["rgba(218,165,81,.8)", "#f0ce80", "#fff1c7"][k];
          c.beginPath();
          c.moveTo(xx - w, yy);
          c.quadraticCurveTo(
            xx - w * 0.8,
            yy + h * 0.52,
            xx - w * 0.28,
            yy + h,
          );
          c.quadraticCurveTo(xx + w * 0.64, yy + h * 0.42, xx + w, yy);
          c.fill();
        }
      }
      if (age > 0.01) {
        for (let j = 0; j < 92; j++) {
          const born = 32.25 + j * 0.079,
            a = t - born;
          if (a < 0 || a > 6.3) continue;
          const p = position(born),
            n = this.guardian.nozzles[1];
          const px =
            p.x +
            (n[0] - ink.originX - 45) * p.scale +
            Math.sin(j * 0.38 + a * 0.67) * a * 3.6;
          const py = p.y + (n[1] - ink.originY + 117) * p.scale - a * 2.1;
          const w = 11 * p.scale + a * 4.6,
            alpha = (1 - a / 6.3) * 0.66;
          oval(
            c,
            px,
            py,
            w * 1.19,
            w * 1.37,
            `rgba(244,232,192,${alpha})`,
            -0.25,
          );
          oval(
            c,
            px - w * 0.27,
            py - w * 0.31,
            w * 0.78,
            w * 0.94,
            `rgba(255,243,205,${alpha * 0.79})`,
            -0.2,
          );
        }
      }
    }
    c.drawImage(
      robot,
      pos.x - ink.originX * pos.scale,
      pos.y - ink.originY * pos.scale,
      robot.width * pos.scale,
      robot.height * pos.scale,
    );
    // The landing bird follows a continuous approach, then transfers its weight in two hops.
    const anchor = this.guardian.shoulder,
      sx = pos.x + (anchor[0] - ink.originX) * pos.scale,
      sy = pos.y + (anchor[1] - ink.originY) * pos.scale;
    if (t < 17) {
      const land = smooth(0.1, 3.6, t),
        depart = smooth(14.3, 17, t),
        hopT = clamp((t - 5.25) / 0.87);
      const hop = Math.abs(Math.sin(hopT * Math.PI * 2)) * (1 - hopT) * 10;
      const bx =
        sx -
        (1 - land) * 432 +
        Math.sin(land * Math.PI) * 27 -
        depart * 265 +
        hopT * 9;
      const by =
        sy -
        (1 - land) * 109 -
        Math.sin(land * Math.PI) * 79 -
        depart * 253 -
        hop -
        7.5;
      bird(c, bx, by, 1.3, t * 29, land === 1 && depart === 0);
    }
    for (let i = 0; i < 27; i++) {
      const start = (i < 16 ? 15.05 : 31.66) + (i % 7) * 0.105,
        a = t - start;
      if (a < 0 || a > 5) continue;
      const p = particles[i],
        x =
          (i % 2 ? 536 : 1384) +
          (p.x % 150) +
          (i % 2 ? 1 : -1) * (a * 41 + a * a * 12) +
          Math.sin(a * 2 + i) * 8;
      const y = 142 + (p.y % 166) - a * (48 + p.speed * 19) - a * a * 8;
      bird(
        c,
        x,
        y,
        (0.26 + p.speed * 0.19) * (1 - a * 0.061),
        (t * 33 + i) * p.speed,
        false,
        i % 2 === 0,
      );
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i],
        a = t - p.birth;
      if (a < 0 || a > 4.3) continue;
      const source = position(p.birth),
        y0 = 704 - (348 + (p.y % 207)) * source.scale;
      const x0 = 1060 + (i % 2 ? 1 : -1) * (115 + (p.x % 113));
      const y = y0 + p.dy * a + 146 * a * a,
        ground = 680 + p.phase * 7;
      const yy =
        y > ground
          ? ground -
            Math.abs(Math.sin((a - Math.sqrt((ground - y0) / 146)) * 9)) *
              Math.max(0, 7 - a * 1.8)
          : y;
      const xx =
        x0 +
        p.dx * Math.min(a, 2) * 0.21 +
        Math.sin(a * 5 + p.phase) * Math.min(12, a * 7);
      if (p.type < 3) {
        oval(c, xx, yy, p.size * 1.55, p.size * 0.72, "#75755a", a * 2 + i);
      } else
        leaf(c, xx, yy, 3 + p.size * 2.3, p.size, p.phase + a * 3, p.color);
    }
    if (age > 0 && age < 4.9) {
      const radius = age * 243,
        alpha = Math.max(0, 1 - age / 4.9);
      for (let i = 0; i < 52; i++) {
        const ang = (i / 52) * TAU,
          px = 1060 + Math.cos(ang) * radius,
          py = 699 + Math.sin(ang) * radius * 0.145;
        const s = (9 + ((i * 5) % 17) + age * 8) * Math.min(1, age * 4);
        oval(
          c,
          px,
          py - s * 0.33,
          s * 1.51,
          s * 0.55,
          `rgba(186,180,139,${alpha * 0.34})`,
          Math.sin(i) * 0.18,
        );
        if (i % 3 === 0)
          oval(
            c,
            px + 0.22 * s,
            py - s * 0.64,
            s * 0.75,
            s * 0.42,
            `rgba(218,209,165,${alpha * 0.4})`,
          );
      }
      c.strokeStyle = `rgba(229,222,178,${alpha * 0.69})`;
      c.lineWidth = 4.1 * alpha + 0.5;
      c.beginPath();
      c.ellipse(
        1060,
        699,
        radius + 1,
        radius * 0.145 + 1,
        0,
        Math.PI * 0.05,
        Math.PI * 0.97,
      );
      c.stroke();
    }
    c.drawImage(this.forest.front, -2 - sway * 0.41, 0, WIDTH + 5, HEIGHT);
    livingForest(c, t, gust, true);
    for (let i = 0; i < 66; i++) {
      const p = particles[i],
        px =
          ((p.x + t * (3 + p.speed * 4) + Math.sin(t * 0.37 + p.phase) * 14) %
            (WIDTH + 24)) -
          12;
      const py =
        (p.y + t * p.speed * 1.5 + Math.cos(t * 0.4 + p.phase) * 9) % 775;
      oval(
        c,
        px,
        py,
        p.size * 0.49,
        p.size * 0.35,
        `rgba(255,236,178,${0.27 + Math.sin(t * 0.9 + i) * 0.17})`,
      );
    }
    const falling = age > 0 ? 67 : 12;
    for (let i = 0; i < falling; i++) {
      const p = particles[i + 68],
        wind = i >= 12 ? age : t;
      const y = ((p.y + wind * (13 + p.speed * 9)) % 853) - 35;
      const x =
        ((p.x +
          Math.sin(wind * 0.64 + p.phase) * 37 +
          wind * (6 + p.speed * 5) +
          (i < 12 ? 0 : Math.exp(-age * 0.55) * age * p.dx * 2.2)) %
          1650) -
        20;
      const a = Math.sin(wind * 1.23 + p.phase) * 1.25 + 0.6,
        size = 5 + p.size * 2.2;
      leaf(
        c,
        x,
        y,
        size,
        (1.6 + p.size * 0.65) *
          (0.25 + Math.abs(Math.sin(wind * 1.47 + i)) * 0.75),
        a,
        p.color,
      );
      if (size > 9)
        stroke(
          c,
          x,
          y,
          x + Math.cos(a) * size * 0.78,
          y + Math.sin(a) * size * 0.78,
          "#9eaa6f",
          0.6,
        );
    }
    c.restore();
  }
}
