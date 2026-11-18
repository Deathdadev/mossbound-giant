import {
  clamp,
  leaf,
  mix,
  oval,
  random,
  stroke,
  surface,
  TAU,
  type Ctx,
} from "./drawing";

export const WIDTH = 1600;
export const HEIGHT = 780;
type Rng = ReturnType<typeof random>;
type Palette = [string, string, string, string];

const rgb = (s: string) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
function tint(a: string, b: string, t: number) {
  const x = rgb(a),
    y = rgb(b);
  return `rgb(${x.map((n, i) => Math.round(mix(n, y[i], t))).join(",")})`;
}

function brush(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  r: Rng,
) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 13; i++) {
    const a = (i * TAU) / 13,
      j = 0.78 + r() * 0.38;
    const px = x + Math.cos(a) * w * j,
      py = y + Math.sin(a) * h * j;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
}

function crown(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: Palette,
  r: Rng,
  fine = 1,
) {
  const count = Math.floor(38 + w * 0.33);
  for (let i = 0; i < count; i++) {
    const angle = r() * TAU,
      rad = Math.sqrt(r());
    const px = x + Math.cos(angle) * w * rad,
      py = y + Math.sin(angle) * h * rad;
    const lit = clamp(
      0.35 - ((py - y) / h) * 0.38 + ((px - x) / w) * 0.22 + r() * 0.29,
    );
    const k = Math.min(3, Math.floor(lit * 4));
    const s = (4 + r() * 11) * fine;
    brush(c, px, py, s * 1.65, s * 0.77, colors[k], r);
    for (let j = 0; j < 6; j++) {
      const qx = px + (r() - 0.5) * s * 3.8,
        qy = py + (r() - 0.5) * s * 2.1;
      leaf(
        c,
        qx,
        qy,
        (3 + r() * 8) * fine,
        (1.3 + r() * 3.4) * fine,
        -0.95 + r() * 2.4,
        colors[Math.min(3, k + (r() > 0.7 ? 1 : 0))],
      );
    }
  }
}

function branch(
  c: Ctx,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  bend: number,
  color: string,
  light: string,
  r: Rng,
) {
  const p: [number, number, number, number][] = [];
  const count = 22;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const a = angle + bend * t + Math.sin(t * 5) * 0.075;
    const w = width * (1 - t * 0.87) * (1 + Math.sin(t * 15) * 0.045);
    const px =
      x +
      Math.cos(angle) * length * t +
      (Math.cos(a) - Math.cos(angle)) * length * t * 0.62;
    const py =
      y +
      Math.sin(angle) * length * t +
      (Math.sin(a) - Math.sin(angle)) * length * t * 0.62;
    p.push([px, py, -Math.sin(a) * w, Math.cos(a) * w]);
  }
  c.beginPath();
  p.forEach(([px, py, nx, ny], i) =>
    i ? c.lineTo(px + nx, py + ny) : c.moveTo(px + nx, py + ny),
  );
  for (let i = p.length - 1; i >= 0; i--)
    c.lineTo(p[i][0] - p[i][2], p[i][1] - p[i][3]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  const stripes = Math.max(4, width * 1.7);
  c.lineCap = "round";
  for (let k = 0; k < stripes; k++) {
    const side = r() * 1.9 - 0.95,
      start = Math.floor(r() * 17),
      end = Math.min(count, start + 2 + Math.floor(r() * 13));
    c.beginPath();
    for (let i = start; i <= end; i++) {
      const s = side + Math.sin(i * 0.52 + k) * 0.042;
      if (i === start) c.moveTo(p[i][0] + p[i][2] * s, p[i][1] + p[i][3] * s);
      else c.lineTo(p[i][0] + p[i][2] * s, p[i][1] + p[i][3] * s);
    }
    c.strokeStyle = side > 0.05 ? light : "rgba(23,37,30,.25)";
    c.lineWidth = 0.5 + r() * Math.max(0.6, width * 0.075);
    c.stroke();
  }
  return p;
}

function fern(
  c: Ctx,
  x: number,
  y: number,
  len: number,
  a: number,
  col: string,
  high: string,
  curve: number,
  fine = false,
) {
  let lx = x,
    ly = y;
  const count = fine ? 17 : 11;
  for (let i = 1; i <= count; i++) {
    const t = i / count,
      ang = a + curve * t;
    const px = x + Math.cos(a + curve * t * 0.6) * len * t;
    const py = y + Math.sin(a + curve * t * 0.6) * len * t;
    stroke(c, lx, ly, px, py, col, Math.max(0.45, (1 - t) * len * 0.02));
    const l = Math.sin(Math.pow(t, 0.77) * Math.PI) * len * 0.22 + 1;
    for (const side of [-1, 1]) {
      const b = ang + side * (1.13 - 0.39 * t);
      leaf(c, px, py, l, l * 0.18, b, i % 4 === 0 ? high : col);
      if (fine && l > 4) {
        for (let j = 1; j <= 6; j++) {
          const v = j / 7,
            xx = px + Math.cos(b) * l * v,
            yy = py + Math.sin(b) * l * v;
          leaf(c, xx, yy, l * 0.23 * (1 - v * 0.6), l * 0.055, b + 0.83, col);
          leaf(c, xx, yy, l * 0.23 * (1 - v * 0.6), l * 0.055, b - 0.83, high);
        }
      }
    }
    lx = px;
    ly = py;
  }
}

function rock(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: Rng,
  lit: number,
) {
  const cs = ["#404c40", "#66705a", "#9f9b73", "#bbb084"];
  c.beginPath();
  c.moveTo(x - w, y);
  c.lineTo(x - w * 0.89, y - h * 0.48);
  c.lineTo(x - w * 0.4, y - h * 0.93);
  c.lineTo(x + w * 0.22, y - h);
  c.lineTo(x + w * 0.78, y - h * 0.65);
  c.lineTo(x + w, y - h * 0.15);
  c.quadraticCurveTo(x, y + h * 0.2, x - w, y);
  c.fillStyle = cs[lit > 0.6 ? 1 : 0];
  c.fill();
  c.fillStyle = cs[lit > 0.6 ? 3 : 2];
  c.beginPath();
  c.moveTo(x - w * 0.89, y - h * 0.48);
  c.lineTo(x - w * 0.4, y - h * 0.93);
  c.lineTo(x + w * 0.22, y - h);
  c.lineTo(x + w * 0.7, y - h * 0.67);
  c.lineTo(x + w * 0.05, y - h * 0.6);
  c.lineTo(x - w * 0.2, y - h * 0.25);
  c.closePath();
  c.fill();
  for (let k = 0; k < w * 3; k++) {
    const u = r() * 2 - 1,
      v = r(),
      px = x + u * w * 0.85,
      py = y - h * (0.55 + Math.sqrt(1 - u * u) * 0.4) + v * h * 0.23;
    brush(
      c,
      px,
      py,
      1 + r() * w * 0.1,
      1 + r() * h * 0.055,
      ["#435941", "#697844", "#84904b", "#adb35f", "#a0a367"][
        Math.floor(r() * (lit > 0.5 ? 5 : 3))
      ],
      r,
    );
  }
}

function oldTree(
  c: Ctx,
  x: number,
  y: number,
  size: number,
  leaning: number,
  light: boolean,
  r: Rng,
) {
  const bark = light ? "#666650" : "#35483e",
    lit = light ? "#999474" : "#63705a";
  const tree = branch(
    c,
    x,
    y,
    -Math.PI / 2 + leaning,
    size * 1.08,
    size * 0.044,
    -0.17,
    bark,
    lit,
    r,
  );
  for (let k = 0; k < 10; k++) {
    const a = -0.1 + r() * 3.4;
    branch(
      c,
      x + (r() - 0.5) * size * 0.045,
      y - r() * size * 0.026,
      a,
      size * (0.07 + r() * 0.14),
      size * (0.005 + r() * 0.012),
      0.19,
      bark,
      lit,
      r,
    );
  }
  for (let k = 0; k < 10; k++) {
    const i = 5 + Math.floor(r() * 14),
      p = tree[i],
      side = k % 2 ? 1 : -1;
    const a = (side > 0 ? -0.48 : -Math.PI + 0.48) + (r() - 0.5) * 0.8;
    const len = size * (0.12 + r() * 0.3) * (1 - i / 45);
    const b = branch(
      c,
      p[0],
      p[1],
      a,
      len,
      size * 0.016 * (1 - i / 30),
      side * -0.6,
      bark,
      lit,
      r,
    );
    for (let n = 0; n < 4; n++) {
      const e = b[6 + Math.floor(r() * 16)];
      const bb = branch(
        c,
        e[0],
        e[1],
        a - side * r() * 1.05,
        len * (0.24 + r() * 0.43),
        size * 0.0045,
        side * 0.25,
        bark,
        lit,
        r,
      );
      const f = bb[22];
      const pal: Palette = light
        ? ["#556647", "#75804f", "#929559", "#b0ad6c"]
        : ["#233d35", "#36513d", "#506241", "#70804b"];
      if (f[1] < y - size * 0.38)
        crown(c, f[0], f[1], len * 0.33, len * 0.16, pal, r, 0.65);
    }
  }
  for (let j = 0; j < size * 0.65; j++) {
    const i = Math.floor(r() * 22),
      p = tree[i],
      side = r() * 1.65 - 1;
    const px = p[0] + p[2] * side,
      py = p[1] + p[3] * side;
    if (r() < 0.75)
      brush(
        c,
        px,
        py,
        0.7 + r() * size * 0.004,
        1 + r() * size * 0.009,
        light ? "#81876a" : "#627052",
        r,
      );
  }
  for (let k = 0; k < 5; k++) {
    let px = x + (r() - 0.5) * size * 0.04,
      py = y,
      phase = r() * 6;
    const height = size * (0.12 + r() * 0.31);
    for (let j = 1; j < 29; j++) {
      const t = j / 29,
        xx = x + Math.sin(t * 6 + phase) * size * 0.037 + leaning * height * t,
        yy = y - t * height;
      stroke(c, px, py, xx, yy, "#394f39", size * 0.0027);
      if (j % 2 === 0)
        leaf(
          c,
          xx,
          yy,
          size * (0.008 + r() * 0.01),
          size * 0.0045,
          -r() * 3.1,
          light ? "#7d8c56" : "#576d45",
        );
      px = xx;
      py = yy;
    }
  }
}

function grain(c: Ctx, w: number, h: number, strength: number, seed: number) {
  const p = c.getImageData(0, 0, w, h),
    r = random(seed);
  for (let i = 0; i < p.data.length; i += 4) {
    const n = (r() + r() - 1) * strength;
    p.data[i] += n;
    p.data[i + 1] += n;
    p.data[i + 2] += n * 0.8;
  }
  c.putImageData(p, 0, 0);
}

export function paintForest() {
  const r = random(8814),
    back = surface(WIDTH, HEIGHT),
    c = back.getContext("2d")!;
  const sky = c.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#b1bda1");
  sky.addColorStop(0.31, "#f0dcb0");
  sky.addColorStop(0.57, "#eddaa8");
  sky.addColorStop(1, "#8c976e");
  c.fillStyle = sky;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  const sun = c.createRadialGradient(1150, 172, 10, 1150, 172, 730);
  sun.addColorStop(0, "#fff6cc");
  sun.addColorStop(0.25, "#f9e9b7");
  sun.addColorStop(0.69, "rgba(230,214,159,.3)");
  sun.addColorStop(1, "rgba(205,209,174,0)");
  c.fillStyle = sun;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  for (let k = 0; k < 100; k++) {
    const x = r() * WIDTH,
      y = r() * 305;
    brush(c, x, y, 18 + r() * 75, 1 + r() * 6, "rgba(255,247,211,.10)", r);
  }
  // Each successive woodland plane has its own pigment range and atmospheric depth.
  for (let layer = 0; layer < 4; layer++) {
    const count = 48 - layer * 8,
      horizon = 413 + layer * 43;
    const palette = [
      ["#c6c9a3", "#d5d4ac", "#e1dbb0", "#e6dfb5"],
      ["#a7b79a", "#b9c0a0", "#c9cba4", "#d9d4ab"],
      ["#91a58c", "#a2af8c", "#b2b994", "#c4c4a0"],
      ["#7d947b", "#8e9f7d", "#a1ac86", "#b3b68d"],
    ][layer] as Palette;
    for (let k = 0; k < count; k++) {
      const x = ((k + r() * 0.9) / count) * 1750 - 75;
      const valley = Math.exp(-Math.pow((x - 1080) / 470, 2));
      const h = 132 + r() * 185 + (1 - valley) * 175 + layer * 8;
      const y = horizon + r() * 50,
        top = y - h,
        w = h * (0.008 + r() * 0.006);
      const pal = palette.map((v) =>
        tint(v, "#f7e5b7", valley * 0.38),
      ) as Palette;
      const tr = branch(
        c,
        x,
        y,
        -1.58 + (r() - 0.5) * 0.18,
        h * 1.08,
        w,
        (r() - 0.5) * 0.3,
        pal[0],
        pal[2],
        r,
      );
      for (let b = 0; b < 5; b++) {
        const p = tr[9 + Math.floor(r() * 11)],
          side = b % 2 ? -1 : 1;
        const len = h * (0.08 + r() * 0.19);
        const end = branch(
          c,
          p[0],
          p[1],
          side > 0 ? -0.7 : -2.5,
          len,
          w * 0.44,
          side * -0.35,
          pal[0],
          pal[1],
          r,
        )[22];
        crown(c, end[0], end[1], 15 + r() * 32, 9 + r() * 15, pal, r, 0.5);
      }
      if (top < 400)
        crown(
          c,
          tr[22][0],
          tr[22][1],
          20 + r() * 34,
          15 + r() * 19,
          pal,
          r,
          0.62,
        );
    }
    const fog = c.createLinearGradient(0, horizon - 110, 0, horizon + 55);
    fog.addColorStop(0, "rgba(231,222,183,0)");
    fog.addColorStop(1, `rgba(224,220,180,${0.28 - layer * 0.03})`);
    c.fillStyle = fog;
    c.fillRect(0, horizon - 110, WIDTH, 165);
  }
  for (const [x, y, h, a] of [
    [65, 586, 660, 0.06],
    [287, 558, 600, -0.05],
    [496, 548, 650, 0.09],
    [769, 535, 630, -0.12],
    [1382, 539, 640, 0.05],
    [1531, 559, 720, -0.02],
  ]) {
    oldTree(c, x, y, h, a, true, r);
  }
  const clearing = c.createRadialGradient(1100, 230, 15, 1100, 230, 650);
  clearing.addColorStop(0, "rgba(255,233,178,.68)");
  clearing.addColorStop(0.63, "rgba(247,223,166,.19)");
  clearing.addColorStop(1, "rgba(230,216,170,0)");
  c.fillStyle = clearing;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 8; i++) {
    const x = 1080 + i * 46,
      slant = 250 + i * 8;
    const g = c.createLinearGradient(x - slant, 620, x, 0);
    g.addColorStop(0, "rgba(255,239,190,0)");
    g.addColorStop(0.45, "rgba(255,242,197,.065)");
    g.addColorStop(1, "rgba(255,247,210,.25)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, -20);
    c.lineTo(x + 8 + r() * 20, -20);
    c.lineTo(x - slant + 45, 671);
    c.lineTo(x - slant - 39, 671);
    c.fill();
  }
  const ground = c.createLinearGradient(0, 475, 0, 780);
  ground.addColorStop(0, "#a3ad82");
  ground.addColorStop(0.3, "#86946b");
  ground.addColorStop(0.72, "#647653");
  ground.addColorStop(1, "#3c5946");
  c.fillStyle = ground;
  c.beginPath();
  c.moveTo(0, 478);
  for (let x = 0; x <= WIDTH; x += 10)
    c.lineTo(x, 494 + Math.sin(x * 0.006) * 13 + Math.sin(x * 0.022) * 5);
  c.lineTo(WIDTH, HEIGHT);
  c.lineTo(0, HEIGHT);
  c.fill();
  for (let i = 0; i < 6800; i++) {
    const y = 482 + r() * 310,
      x = r() * 1650 - 25,
      s = (y - 435) / 310;
    const light = clamp(
      0.5 +
        Math.cos(x / 110 + y / 36) * 0.2 +
        Math.sin(x * 0.028 + y * 0.04) * 0.13 +
        r() * 0.27,
    );
    const col = tint("#3d5948", "#beBB7e", light);
    brush(c, x, y, (0.7 + r() * 23) * s, (0.5 + r() * 4) * s, col, r);
    if (i % 3 === 0) {
      stroke(
        c,
        x,
        y,
        x + (r() - 0.5) * 7 * s,
        y - (1 + r() * 10) * s,
        col,
        0.6 + s * 0.8,
      );
    }
  }
  for (let i = 0; i < 68; i++) {
    const x = r() * WIDTH,
      y = 492 + r() * 270,
      w = ((4 + r() * 33) * (y - 380)) / 310;
    rock(c, x, y, w, w * (0.35 + r() * 0.5), r, r());
  }
  for (let i = 0; i < 94; i++) {
    const x = (i / 93) * 1680 - 40,
      y = 500 + Math.sin(x * 0.009) * 12 + r() * 23;
    const opening = Math.exp(-Math.pow((x - 1110) / 235, 2));
    const h = (16 + r() * 33) * (1 - opening * 0.59);
    const pal: Palette =
      x > 790 && x < 1300
        ? ["#82936d", "#96a077", "#b0b489", "#c1bf91"]
        : ["#526d54", "#73865e", "#909b69", "#a7ad78"];
    crown(c, x, y - h * 0.45, 16 + r() * 35, h, pal, r, 0.44);
  }
  for (let i = 0; i < 26; i++) {
    const x = i % 3 ? r() * 735 : 1265 + r() * 400,
      y = 537 + r() * 110;
    crown(
      c,
      x,
      y,
      23 + r() * 39,
      12 + r() * 22,
      ["#3e5d43", "#5c754c", "#7b8c55", "#a0a76a"],
      r,
      0.55,
    );
  }
  for (const [x, y, w, h] of [
    [428, 619, 82, 48],
    [504, 623, 44, 29],
    [1382, 629, 72, 43],
    [1329, 637, 32, 22],
    [739, 675, 32, 18],
  ])
    rock(c, x, y, w, h, r, 0.7);
  oldTree(c, 345, 604, 790, -0.11, false, r);
  oldTree(c, 1437, 610, 812, 0.09, false, r);
  for (let i = 0; i < 41; i++) {
    const x = r() * WIDTH,
      y = 496 + r() * 200,
      len = ((15 + r() * 48) * (y - 400)) / 270;
    for (let j = 0; j < 5; j++)
      fern(
        c,
        x,
        y,
        len * (0.7 + r() * 0.6),
        -2.8 + r() * 2.45,
        "#566e4b",
        "#86915d",
        (r() - 0.5) * 0.7,
      );
  }
  // Tall foreground trunks frame, rather than obscure, the sunlit clearing.
  oldTree(c, 71, 811, 1040, 0.11, false, r);
  oldTree(c, 1636, 801, 1060, -0.16, false, r);
  const bough = branch(c, 5, 80, -0.18, 745, 31, 0.19, "#35483b", "#7c8061", r);
  for (let k = 0; k < 25; k++) {
    const p = bough[2 + Math.floor(r() * 21)],
      b = branch(
        c,
        p[0],
        p[1],
        0.3 + r() * 2,
        25 + r() * 105,
        1.7 + r() * 3.3,
        -0.43,
        "#3a4d39",
        "#74805a",
        r,
      )[22];
    crown(
      c,
      b[0],
      b[1],
      24 + r() * 49,
      12 + r() * 25,
      ["#243e32", "#3b5339", "#586d40", "#7d8a4e"],
      r,
      0.78,
    );
  }
  for (let k = 0; k < 15; k++) {
    crown(
      c,
      r() * 805 - 65,
      -15 + r() * 54,
      65 + r() * 65,
      36 + r() * 34,
      ["#284331", "#3d5536", "#607342", "#879457"],
      r,
      0.95,
    );
  }
  for (let k = 0; k < 12; k++)
    crown(
      c,
      1370 + r() * 330,
      -5 + r() * 95,
      48 + r() * 56,
      30 + r() * 30,
      ["#344a35", "#526841", "#7b874f", "#a0a263"],
      r,
      0.83,
    );
  for (let i = 0; i < 27; i++) {
    const x = i < 17 ? r() * 610 : 1350 + r() * 300,
      y = 30 + r() * 49,
      l = 28 + r() * 101;
    let px = x,
      py = y;
    for (let j = 1; j <= 24; j++) {
      const v = j / 24,
        xx = x + Math.sin(v * 5.5 + i) * 6 * v,
        yy = y + l * v;
      stroke(c, px, py, xx, yy, "#526944", 1.5 - v * 0.5);
      if (j % 3 === 0)
        leaf(
          c,
          xx,
          yy,
          5 + r() * 8,
          2 + r() * 1.8,
          j % 2 ? 0.85 : 2.4,
          j % 2 ? "#68804c" : "#809054",
        );
      px = xx;
      py = yy;
    }
  }
  const amber = c.createRadialGradient(1140, 105, 10, 1140, 105, 536);
  amber.addColorStop(0, "rgba(255,224,143,.24)");
  amber.addColorStop(0.65, "rgba(250,218,141,.08)");
  amber.addColorStop(1, "rgba(255,222,148,0)");
  c.fillStyle = amber;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  grain(c, WIDTH, HEIGHT, 9, 982);

  const front = surface(WIDTH, HEIGHT),
    f = front.getContext("2d")!;
  const fg = f.createLinearGradient(0, 700, 0, 780);
  fg.addColorStop(0, "rgba(41,65,46,0)");
  fg.addColorStop(1, "#263f33");
  f.fillStyle = fg;
  f.fillRect(0, 700, WIDTH, 80);
  for (let i = 0; i < 1500; i++) {
    const x = r() * WIDTH,
      y = 718 + r() * 80,
      h = 5 + r() * 17;
    leaf(
      f,
      x,
      y,
      h,
      1 + r() * 2.5,
      -1.6 + (r() - 0.5) * 1.8,
      ["#354e3b", "#4c6244", "#64754b", "#7c8757"][i % 4],
    );
  }
  for (let i = 0; i < 100; i++) {
    const x = r() * WIDTH,
      y = 737 + r() * 78,
      len = 23 + r() * 74;
    for (let j = 0; j < 4; j++)
      fern(
        f,
        x,
        y,
        len * (0.65 + r() * 0.4),
        -2.8 + r() * 2.55,
        ["#253f31", "#39543b", "#4d6644"][i % 3],
        ["#486240", "#60784d", "#89925c"][i % 3],
        (r() - 0.5) * 0.85,
        i % 4 === 0,
      );
  }
  for (let i = 0; i < 145; i++) {
    const x = 96 + r() * 1380,
      y = 608 + r() * 131,
      h = 8 + r() * 14;
    stroke(f, x, y, x + 2.5, y - h, "#5b744d", 0.9);
    leaf(f, x, y - 3, 5.8, 1.7, -2.45, "#71864f");
    const xx = x + 2.5,
      yy = y - h;
    for (let p = 0; p < 5; p++)
      oval(
        f,
        xx + Math.cos((p * TAU) / 5) * 1.7,
        yy + Math.sin((p * TAU) / 5) * 1.5,
        1.8,
        1,
        i % 6 ? "#d4d5ac" : "#b2abc0",
        (p * TAU) / 5,
      );
    oval(f, xx, yy, 1.05, 0.95, "#cfbc69");
  }
  grain(f, WIDTH, HEIGHT, 7, 6422);
  return { back, front };
}

let forestCache: ReturnType<typeof paintForest> | undefined;
export const getForest = () => (forestCache ??= paintForest());

export function livingForest(
  c: Ctx,
  t: number,
  gust: number,
  foreground: boolean,
) {
  const r = random(foreground ? 734 : 826);
  const n = foreground ? 43 : 20;
  for (let i = 0; i < n; i++) {
    const x = r() * 1660 - 30,
      y = foreground ? 738 + r() * 76 : 526 + r() * 115;
    const len = foreground ? 28 + r() * 67 : 12 + r() * 27;
    const w =
      Math.sin(t * (0.5 + r() * 0.4) + i * 2.4) * 0.065 +
      Math.sin(t * 1.45 + i) * 0.019;
    const a = -1.76 + (r() - 0.5) * 1.65 + w + gust * (x > 1050 ? 0.61 : -0.61);
    fern(
      c,
      x,
      y,
      len,
      a,
      foreground ? "#3c583b" : "#798951",
      foreground ? "#72834e" : "#a6ab6c",
      w * 2 + 0.18,
    );
  }
}
