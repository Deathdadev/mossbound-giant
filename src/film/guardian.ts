import {
  between,
  chain,
  clamp,
  cross,
  leaf,
  mix,
  norm,
  oval,
  point,
  random,
  rx,
  ry,
  rz,
  scale,
  smooth,
  stroke,
  surface,
  TAU,
  trans,
  type Mat,
  type V3,
} from "./drawing";
import { InkRenderer, type Piece, type Shape } from "./ink";

type Paint = Piece["paint"];
type Growth = { at: V3; size: number; type: number };
type Vine = { at: V3; length: number; seed: number; thickness: number };

function joint(a: V3, b: V3, l1: number, l2: number, pole: V3): V3 {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    n = norm(d);
  const len = Math.min(l1 + l2 - 0.0001, Math.max(0.001, Math.hypot(...d)));
  const along = (l1 * l1 - l2 * l2 + len * len) / (2 * len),
    offset = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const bend = norm(cross(cross(n, pole), n));
  return [
    a[0] + n[0] * along + bend[0] * offset,
    a[1] + n[1] * along + bend[1] * offset,
    a[2] + n[2] * along + bend[2] * offset,
  ];
}

function mossBrush(seed: number) {
  const canvas = surface(96, 96),
    c = canvas.getContext("2d")!,
    r = random(seed);
  const palette = [
    "#47573c",
    "#596c43",
    "#75834b",
    "#929951",
    "#a8ac61",
    "#c2bd78",
  ];
  for (let j = 0; j < 190; j++) {
    const a = r() * TAU,
      rad = Math.sqrt(r()),
      x = 48 + Math.cos(a) * 37 * rad,
      y = 68 + Math.sin(a) * 12 * rad;
    const h = (1 - rad) * 12 + r() * 8,
      p = Math.min(5, Math.floor(r() * 3 + (74 - y) * 0.12));
    leaf(
      c,
      x,
      y + 1,
      4 + h,
      2.3 + r() * 3,
      -2.55 + r() * 2.1,
      palette[clamp(p, 0, 5)],
    );
    if (j % 4 === 0)
      leaf(
        c,
        x - 1,
        y - h * 0.5,
        4 + r() * 3,
        1.8,
        -1.4 + r(),
        palette[Math.min(5, p + 1)],
      );
  }
  for (let j = 0; j < 7; j++) {
    const x = 27 + r() * 45,
      y = 59 + r() * 9,
      len = 12 + r() * 29,
      a = -1.6 + (r() - 0.5) * 1.4;
    const xx = x + Math.cos(a) * len,
      yy = y + Math.sin(a) * len;
    stroke(c, x, y, xx, yy, "#637a48", 1.3);
    for (let k = 1; k < 6; k++) {
      const f = k / 6,
        size = (1 - f * 0.7) * 7;
      leaf(
        c,
        mix(x, xx, f),
        mix(y, yy, f),
        size,
        1.8,
        a - 0.85,
        palette[3 + (k % 2)],
      );
      leaf(
        c,
        mix(x, xx, f + 0.03),
        mix(y, yy, f + 0.03),
        size,
        1.9,
        a + 0.95,
        palette[2 + (k % 2)],
      );
    }
    if (seed % 3 === 0 && j % 2 === 0) {
      for (let p = 0; p < 5; p++)
        oval(
          c,
          xx + Math.cos((p * TAU) / 5) * 2.5,
          yy + Math.sin((p * TAU) / 5) * 2.5,
          2.7,
          1.6,
          "#e7e2bd",
          (p * TAU) / 5,
        );
      oval(c, xx, yy, 1.5, 1.4, "#c6b363");
    }
  }
  return canvas;
}

export class Guardian {
  readonly ink = new InkRenderer();
  private tufts = Array.from({ length: 12 }, (_, i) => mossBrush(711 + i * 17));
  shoulder: V3 = [0, 0, 0];
  core: V3 = [0, 0, 0];
  nozzles: V3[] = [];
  lastCel = -1;

  draw(time: number) {
    const cel = Math.floor(time * 12);
    if (this.lastCel === cel) return this.ink.canvas;
    this.lastCel = cel;
    const t = cel / 12,
      rise = smooth(15.6, 26.7, t),
      awaken = smooth(4.2, 14.8, t);
    const brace = smooth(13, 15.6, t) * (1 - smooth(15.6, 19.2, t));
    const launchPrep = smooth(28.9, 31.1, t) * (1 - smooth(31.2, 32.3, t));
    const thrust = smooth(31, 32.4, t),
      flight = smooth(32.1, 35.6, t);
    const breath =
      Math.sin(t * 1.22) * (0.009 + 0.008 * awaken) +
      Math.sin(t * 0.46) * 0.008;
    const hipY = 1.39 + rise * 1.72 - brace * 0.13 - launchPrep * 0.46;
    const drift = Math.sin(t * 0.51) * 0.009;
    const yaw = -0.48 + Math.sin(t * 0.32) * 0.014 - flight * 0.18;
    const root = chain(ry(yaw), rz(drift - flight * 0.17));
    const body = chain(
      root,
      trans(0.07 * (1 - rise) - brace * 0.04, hipY, -0.06),
      rz(-0.055 * (1 - rise) + breath * 0.4),
      rx(0.23 * (1 - rise) + brace * 0.1 - flight * 0.18),
    );
    const pieces: Piece[] = [],
      growth: Growth[] = [],
      vines: Vine[] = [];
    const add = (
      parent: Mat,
      shape: Shape,
      paint: Paint,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      rot?: Mat,
    ) => {
      const m = chain(
        parent,
        trans(x, y, z),
        ...(rot ? [rot] : []),
        scale(w, h, d),
      );
      pieces.push({ shape, paint, matrix: m });
      return m;
    };
    const disk = (
      p: Mat,
      x: number,
      y: number,
      z: number,
      radius: number,
      thick: number,
      paint: Paint,
      height = radius,
    ) => add(p, "drum", paint, x, y, z, radius, thick, height, rx(Math.PI / 2));
    const sprout = (
      m: Mat,
      total: number,
      seed: number,
      width: number,
      spread = 0.95,
    ) => {
      const r = random(seed);
      for (let i = 0; i < total; i++) {
        const a = r() * TAU,
          rad = Math.sqrt(r()) * spread;
        const p = point(m, [
          Math.cos(a) * rad,
          Math.sqrt(Math.max(0, 1 - rad * rad)) * 1.045,
          Math.sin(a) * rad,
        ]);
        growth.push({
          at: p,
          size: width * (0.55 + r() * 0.72),
          type: Math.floor(r() * 12),
        });
      }
    };
    const trail = (m: Mat, total: number, seed: number, length: number) => {
      const r = random(seed);
      for (let i = 0; i < total; i++) {
        const a = r() * Math.PI * 1.9 - Math.PI;
        vines.push({
          at: point(m, [
            Math.sin(a) * 0.95,
            -0.05 + r() * 0.45,
            Math.cos(a) * 0.95,
          ]),
          length: length * (0.4 + r() * 0.75),
          seed: seed + i * 61,
          thickness: 1.2 + r() * 1.55,
        });
      }
    };
    // Interlocking chassis, independent bearing races, and recessed chest aperture.
    add(body, "round", "joint", 0, 0.13, 0, 0.94, 0.56, 0.64);
    add(body, "cuff", "ochre", 0, 0.42, 0.025, 1.02, 0.18, 0.7);
    for (let i = 0; i < 3; i++)
      add(
        body,
        "cuff",
        i === 1 ? "copper" : "joint",
        0,
        0.64 + i * 0.15,
        0.04,
        0.87 + i * 0.06,
        0.1,
        0.65,
      );
    const chest = add(
      body,
      "chest",
      "stone",
      0,
      1.55 + breath,
      0,
      1.32,
      1.02,
      0.83,
    );
    add(body, "cuff", "sage", 0, 0.82, 0.01, 1.035, 0.12, 0.726);
    add(body, "cuff", "iron", 0, 2.39 + breath, -0.025, 0.83, 0.14, 0.64);
    add(body, "rod", "joint", 0, 2.67 + breath, 0, 0.49, 0.3, 0.47);
    for (let i = 0; i < 3; i++)
      add(
        body,
        "cuff",
        i % 2 ? "copper" : "iron",
        0,
        2.54 + i * 0.13 + breath,
        0,
        0.515,
        0.044,
        0.5,
      );
    for (const s of [-1, 1]) {
      add(
        body,
        "shell",
        "sage",
        s * 0.81,
        1.64,
        -0.64,
        0.53,
        1.03,
        0.49,
        rz(-s * 0.09),
      );
      add(body, "cuff", "copper", s * 0.84, 0.79, -0.65, 0.41, 0.15, 0.44);
      add(body, "cuff", "dark", s * 0.85, 0.58, -0.65, 0.39, 0.12, 0.4);
      add(
        body,
        "cuff",
        thrust > 0.12 ? "lamp" : "iron",
        s * 0.85,
        0.45,
        -0.65,
        0.29,
        0.04,
        0.33,
      );
      add(
        body,
        "plate",
        "iron",
        s * 0.82,
        1.61,
        0.64,
        0.19,
        0.32,
        0.115,
        rz(s * -0.18),
      );
      for (let k = 0; k < 4; k++)
        add(
          body,
          "plate",
          "dark",
          s * 0.82,
          1.43 + k * 0.112,
          0.74,
          0.134,
          0.027,
          0.025,
          rz(s * -0.18),
        );
      disk(body, s * 0.63, 2.14, 0.687, 0.061, 0.031, "copper");
      for (let k = 0; k < 3; k++)
        disk(
          body,
          s * (0.4 + k * 0.19),
          1.03 - k * 0.018,
          0.678,
          0.034,
          0.02,
          "joint",
        );
    }
    const centerY = 1.65 + breath;
    disk(body, 0, centerY, 0.82, 0.454, 0.11, "joint");
    disk(body, 0, centerY, 0.91, 0.393, 0.059, "copper");
    disk(body, 0, centerY, 0.951, 0.317, 0.051, "dark");
    disk(body, 0, centerY, 0.993, 0.237, 0.032, "ochre");
    disk(body, 0, centerY, 1.027, 0.183, 0.031, "lamp");
    disk(body, -0.024, centerY + 0.03, 1.065, 0.113, 0.007, "ivory");
    for (let k = 0; k < 8; k++)
      disk(
        body,
        Math.sin((k * TAU) / 8) * 0.346,
        centerY + Math.cos((k * TAU) / 8) * 0.346,
        0.973,
        0.022,
        0.011,
        "joint",
      );
    this.core = this.ink.project(point(body, [0, centerY, 1.08]));
    this.nozzles = [-1, 1].map((s) =>
      this.ink.project(point(body, [s * 0.85, 0.42, -0.65])),
    );
    sprout(chest, 28, 512, 28, 0.88);
    trail(chest, 13, 985, 1.39);
    // The head turns in volume; all lenses, cheek plates and surface wear share its transform.
    const nod =
      0.31 -
      awaken * 0.085 -
      rise * 0.12 -
      smooth(27.7, 28.18, t) * 0.45 +
      Math.sin(t * 0.8) * 0.014 +
      brace * 0.09;
    const head = chain(
      body,
      trans(-0.055, 2.83 + breath, 0.09),
      ry(-0.19 + Math.sin(t * 0.38) * 0.037 + rise * 0.13),
      rx(nod),
      rz(-0.055 + awaken * 0.028),
    );
    const helm = add(head, "helmet", "ochre", 0, 0.26, 0, 0.795, 0.658, 0.685);
    add(head, "plate", "joint", 0, 0.19, 0.487, 0.693, 0.29, 0.241);
    add(
      head,
      "dome",
      "stone",
      0,
      0.535,
      -0.015,
      0.82,
      0.431,
      0.714,
      rx(-0.045),
    );
    add(head, "cuff", "sage", 0, 0.409, 0.01, 0.816, 0.087, 0.72);
    for (const s of [-1, 1]) {
      const side = chain(head, trans(s * 0.344, 0.189, 0.635), ry(s * 0.22));
      disk(side, 0, 0, 0, 0.264, 0.087, "iron");
      disk(side, 0, 0, 0.079, 0.222, 0.038, "copper");
      disk(side, 0, 0, 0.113, 0.174, 0.029, "dark");
      disk(side, 0, 0, 0.141, 0.128, 0.018, "lamp");
      disk(side, -0.024, 0.028, 0.157, 0.06, 0.009, "ivory");
      add(
        head,
        "cuff",
        "iron",
        s * 0.758,
        0.12,
        -0.006,
        0.273,
        0.093,
        0.274,
        rz(Math.PI / 2),
      );
      add(
        head,
        "cuff",
        "ochre",
        s * 0.848,
        0.12,
        -0.006,
        0.207,
        0.033,
        0.206,
        rz(Math.PI / 2),
      );
      disk(head, s * 0.435, -0.105, 0.581, 0.054, 0.026, "iron");
    }
    add(head, "plate", "stone", 0, -0.137, 0.484, 0.41, 0.159, 0.169);
    for (let i = -2; i <= 2; i++)
      add(head, "plate", "dark", i * 0.107, -0.137, 0.651, 0.024, 0.076, 0.012);
    sprout(helm, 34, 42, 26, 0.85);
    trail(helm, 5, 741, 0.43);

    for (const side of [-1, 1]) {
      const s = side;
      const hip: V3 = [s * 0.68, hipY - 0.07, -0.06];
      const ankle: V3 = [
        s * mix(1.13, 0.88, rise),
        0.36 + flight * 0.23,
        mix(s > 0 ? -1.65 : 1.17, s > 0 ? -0.24 : 0.13, rise) - flight * 0.33,
      ];
      const knee = joint(hip, ankle, 1.47, 1.41, [
        s * 0.36,
        s > 0 ? -1.3 * (1 - rise) : 0.03,
        1,
      ]);
      const upper = chain(root, between(hip, knee)),
        lower = chain(root, between(knee, ankle));
      add(upper, "shell", "sage", 0, -0.02, 0, 0.491, 0.91, 0.527);
      add(upper, "cuff", "iron", 0, 0.64, 0, 0.474, 0.126, 0.486);
      add(lower, "rod", "joint", 0, 0, 0, 0.268, 1.045, 0.291);
      const greave = add(
        lower,
        "shell",
        "ochre",
        0,
        0.055,
        0.025,
        0.449,
        0.789,
        0.474,
      );
      add(lower, "cuff", "sage", 0, -0.54, 0.033, 0.465, 0.109, 0.484);
      add(lower, "cuff", "joint", 0, 0.73, 0, 0.35, 0.14, 0.355);
      const kneeBase = chain(root, trans(...knee), rx(-0.15 * (1 - rise)));
      add(
        kneeBase,
        "drum",
        "joint",
        0,
        0,
        0,
        0.398,
        0.443,
        0.414,
        rz(Math.PI / 2),
      );
      for (const q of [-1, 1])
        add(
          kneeBase,
          "drum",
          "copper",
          q * 0.416,
          0,
          0,
          0.292,
          0.057,
          0.285,
          rz(Math.PI / 2),
        );
      const pad = add(
        kneeBase,
        "dome",
        "stone",
        0,
        0.027,
        0.271,
        0.489,
        0.427,
        0.436,
        rx(0.7),
      );
      sprout(pad, 16, 201 + s, 26);
      trail(pad, 5, 845 + s, 0.73);
      sprout(greave, 7, 33 + s, 21);
      const foot = chain(
        root,
        trans(...ankle),
        ry(s * 0.105),
        rx((s === 1 ? -0.47 : 0.02) * (1 - rise) - flight * 0.28),
      );
      add(foot, "boot", "joint", 0, -0.245, 0.223, 0.461, 0.092, 0.717);
      add(foot, "boot", "stone", 0, -0.08, 0.28, 0.465, 0.237, 0.735);
      for (let k = 0; k < 3; k++)
        add(
          foot,
          "plate",
          "sage",
          (k - 1) * 0.261,
          -0.154,
          0.818,
          0.135,
          0.115,
          0.23,
        );
      const shoulderLocal = point(
        chain(
          trans(0.07 * (1 - rise), hipY, -0.06),
          rz(-0.055 * (1 - rise) + breath * 0.4),
          rx(0.23 * (1 - rise) + brace * 0.1 - flight * 0.18),
        ),
        [s * 1.247, 2.0 + breath, -0.01],
      );
      const palm: V3 = [
        s * (1.99 + (1 - rise) * 0.15 + Math.sin(t * 0.5 + s) * 0.013),
        mix(s > 0 ? 0.64 : 0.79, 2.39, rise) -
          launchPrep * 0.23 +
          flight * 0.59,
        mix(s > 0 ? 0.82 : 1.19, 0.18, rise) + brace * 0.075 - flight * 0.73,
      ];
      const elbow = joint(shoulderLocal, palm, 1.46, 1.55, [
        s * 0.67,
        0.03,
        -0.75,
      ]);
      const arm = chain(root, between(shoulderLocal, elbow)),
        fore = chain(root, between(elbow, palm));
      add(arm, "rod", "joint", 0, -0.07, 0, 0.291, 0.95, 0.331);
      add(arm, "shell", "stone", 0, -0.007, 0, 0.46, 0.623, 0.468);
      add(arm, "cuff", "iron", 0, 0.445, 0, 0.449, 0.122, 0.462);
      for (const k of [-1, 1])
        add(arm, "rod", "copper", k * 0.307, 0.67, 0.042, 0.08, 0.28, 0.08);
      const ep = chain(root, trans(...elbow));
      add(ep, "drum", "joint", 0, 0, 0, 0.324, 0.416, 0.329, rz(Math.PI / 2));
      add(
        ep,
        "drum",
        "ochre",
        s * 0.408,
        0,
        0,
        0.299,
        0.081,
        0.298,
        rz(Math.PI / 2),
      );
      add(
        ep,
        "drum",
        "iron",
        s * 0.485,
        0,
        0,
        0.16,
        0.021,
        0.159,
        rz(Math.PI / 2),
      );
      add(fore, "rod", "joint", 0, 0.08, 0, 0.287, 1.02, 0.305);
      for (let k = 0; k < 3; k++) {
        const size = 0.408 + (2 - k) * 0.045;
        add(
          fore,
          "cuff",
          k === 0 ? "ochre" : "stone",
          0,
          -0.516 + k * 0.465,
          0.012,
          size,
          0.249,
          size * 1.05,
        );
        add(
          fore,
          "cuff",
          "iron",
          0,
          -0.3 + k * 0.465,
          0.006,
          size * 0.937,
          0.034,
          size * 0.975,
        );
      }
      const shoulder = chain(
        root,
        trans(...shoulderLocal),
        rz(-s * 0.105 - s * rise * 0.041),
        rx(0.11),
      );
      add(shoulder, "round", "joint", s * 0.12, 0.06, 0, 0.664, 0.637, 0.637);
      add(
        shoulder,
        "cuff",
        "copper",
        s * 0.182,
        0.113,
        0,
        0.767,
        0.144,
        0.716,
        rz(-s * 0.14),
      );
      const pauldron = add(
        shoulder,
        "dome",
        s === 1 ? "sage" : "ochre",
        s * 0.164,
        0.365,
        -0.05,
        0.814,
        0.581,
        0.794,
        rz(-s * 0.16),
      );
      sprout(pauldron, s > 0 ? 56 : 37, 338 + s, s > 0 ? 35 : 29);
      trail(pauldron, 13, 634 + s, 1.55);
      if (s === 1)
        this.shoulder = this.ink.project(point(shoulder, [0.28, 1.03, 0.12]));
      for (let k = 0; k < 3; k++)
        disk(
          shoulder,
          s * (-0.16 + k * 0.26),
          0.293 - k * 0.04,
          0.665 - k * 0.02,
          0.042,
          0.019,
          "iron",
        );
      const hand = chain(
        root,
        trans(...palm),
        ry(s * -0.21),
        rx(0.08 + (1 - rise) * 0.22),
      );
      add(hand, "round", "joint", 0, 0.08, 0, 0.284, 0.309, 0.306);
      const handPlate = add(
        hand,
        "plate",
        "sage",
        s * 0.021,
        -0.082,
        0.025,
        0.346,
        0.345,
        0.36,
      );
      for (let k = 0; k < 3; k++) {
        const p = chain(
          hand,
          trans((k - 1) * 0.228, -0.248, 0.169),
          rx(-0.15 - k * 0.055 - (1 - rise) * 0.23),
          rz((k - 1) * 0.075),
        );
        add(p, "shell", "ochre", 0, -0.123, 0, 0.119, 0.19, 0.164);
        add(p, "drum", "joint", 0, -0.31, 0.016, 0.102, 0.069, 0.137);
        add(
          p,
          "boot",
          "stone",
          0,
          -0.396,
          0.058,
          0.111,
          0.139,
          0.147,
          rx(-0.3),
        );
      }
      add(
        hand,
        "shell",
        "ochre",
        -s * 0.317,
        -0.065,
        0.182,
        0.126,
        0.232,
        0.16,
        rz(s * -0.49),
      );
      add(
        hand,
        "round",
        "iron",
        -s * 0.395,
        -0.274,
        0.242,
        0.107,
        0.154,
        0.128,
      );
      sprout(handPlate, 9, 862 + s, 17);
      trail(handPlate, 3, 723 + s, 0.35);
    }
    this.ink.core =
      0.24 + awaken * (0.5 + Math.sin(t * 2.2) * 0.24) + thrust * 0.35;
    this.ink.render(pieces);
    const { context: c, depth, width, height } = this.ink;
    const visible = (p: V3, bias: number) => {
      const x = Math.round(p[0]),
        y = Math.round(p[1]);
      return (
        x >= 0 &&
        y >= 0 &&
        x < width &&
        y < height &&
        depth[y * width + x] < p[2] + bias
      );
    };
    for (const v of vines) {
      const r = random(v.seed),
        phase = r() * TAU,
        count = 18,
        spread = 0.02 + r() * 0.065;
      const len = v.length * (1 - rise * (r() > 0.67 ? 0.61 : 0.07));
      let prev = this.ink.project(v.at);
      for (let i = 1; i <= count; i++) {
        const f = i / count;
        const pos: V3 = [
          v.at[0] +
            Math.sin(f * 7 + phase) * spread * f +
            Math.sin(t * 1.05 + phase) * 0.03 * f +
            f * f * flight * 0.35,
          v.at[1] - len * f,
          v.at[2] + Math.sin(f * 4) * 0.07,
        ];
        const p = this.ink.project(pos);
        if (visible(p, 0.075)) {
          stroke(
            c,
            prev[0],
            prev[1],
            p[0],
            p[1],
            i % 5 ? "#536447" : "#79805a",
            v.thickness * (1 - f * 0.68),
          );
          if (i % 2 === 0) {
            const side = i % 4 ? 1 : -1;
            leaf(
              c,
              p[0],
              p[1],
              (3.3 + r() * 4.4) * (1 - f * 0.36),
              2 + r() * 2,
              side > 0 ? 0.65 + r() * 0.8 : 2.2 + r() * 0.55,
              ["#667847", "#7e8b50", "#92a05c"][Math.floor(r() * 3)],
            );
          }
        }
        prev = p;
      }
    }
    growth.sort((a, b) => a.at[2] - b.at[2]);
    for (const g of growth) {
      const p = this.ink.project(g.at);
      if (visible(p, 0.22)) {
        const sway = Math.sin(t * 1.01 + g.type) * 0.024 + flight * 0.04;
        c.save();
        c.translate(p[0], p[1]);
        c.rotate(sway);
        c.drawImage(
          this.tufts[g.type],
          -g.size * 0.5,
          -g.size * 0.72,
          g.size,
          g.size,
        );
        c.restore();
      }
    }
    // A tiny sapling makes the guardian's scale readable even without a human figure.
    const sap = this.ink.project(point(head, [-0.22, 0.925, -0.03]));
    const bend = Math.sin(t * 1.1) * 1.7 - flight * 8;
    c.strokeStyle = "#4e6442";
    c.lineWidth = 1.7;
    c.beginPath();
    c.moveTo(sap[0], sap[1]);
    c.quadraticCurveTo(sap[0] - 5, sap[1] - 18, sap[0] + bend - 2, sap[1] - 31);
    c.stroke();
    for (let i = 0; i < 8; i++)
      leaf(
        c,
        sap[0] - 2 + (bend * i) / 8,
        sap[1] - 5 - i * 3.2,
        7 + Math.sin(i) * 2.4,
        3.25,
        i % 2 ? -0.55 + bend * 0.018 : -2.59,
        i % 3 ? "#7f9251" : "#b4b16b",
      );
    const p = this.core,
      glow =
        (0.18 + awaken * 0.32) * (1 + Math.sin(t * 2.2) * 0.24) + thrust * 0.2;
    const halo = c.createRadialGradient(p[0], p[1], 2, p[0], p[1], 43);
    halo.addColorStop(0, `rgba(255,224,142,${glow})`);
    halo.addColorStop(0.35, `rgba(249,201,103,${glow * 0.39})`);
    halo.addColorStop(1, "rgba(250,198,91,0)");
    c.fillStyle = halo;
    c.fillRect(p[0] - 43, p[1] - 43, 86, 86);
    return this.ink.canvas;
  }
}
