import {
  clamp,
  cross,
  norm,
  oval,
  random,
  stroke,
  surface,
  TAU,
  type Mat,
  type V3,
} from "./drawing";

type Mesh = { vertices: Float32Array; triangles: Uint16Array };
type Pigment =
  | "stone"
  | "ochre"
  | "sage"
  | "iron"
  | "copper"
  | "joint"
  | "lamp"
  | "ivory"
  | "dark";
export type Shape =
  | "shell"
  | "dome"
  | "drum"
  | "round"
  | "plate"
  | "boot"
  | "helmet"
  | "rod"
  | "cuff"
  | "chest";
export type Piece = { shape: Shape; paint: Pigment; matrix: Mat };
const profiles: Record<Shape, [number, number][]> = {
  shell: [
    [-1, 0.63],
    [-0.93, 0.81],
    [-0.72, 0.88],
    [0.05, 1],
    [0.6, 0.97],
    [0.89, 0.83],
    [1, 0.6],
  ],
  chest: [
    [-1, 0.63],
    [-0.87, 0.76],
    [-0.3, 0.88],
    [0.3, 1],
    [0.67, 0.98],
    [0.91, 0.85],
    [1, 0.65],
  ],
  dome: [
    [-1, 0.82],
    [-0.91, 0.96],
    [-0.55, 1],
    [-0.04, 0.97],
    [0.48, 0.8],
    [0.79, 0.57],
    [0.95, 0.28],
    [1, 0.035],
  ],
  drum: [
    [-1, 0.87],
    [-0.85, 1],
    [0.84, 1],
    [1, 0.87],
  ],
  round: Array.from({ length: 17 }, (_, i) => [
    -Math.cos((i * Math.PI) / 16),
    Math.max(0.025, Math.sin((i * Math.PI) / 16)),
  ]),
  plate: [
    [-1, 0.76],
    [-0.8, 0.95],
    [-0.4, 1],
    [0.61, 1],
    [0.9, 0.91],
    [1, 0.75],
  ],
  helmet: [
    [-1, 0.55],
    [-0.81, 0.79],
    [-0.43, 0.9],
    [0.02, 1],
    [0.42, 0.98],
    [0.72, 0.83],
    [0.94, 0.55],
    [1, 0.23],
  ],
  boot: [
    [-1, 0.85],
    [-0.82, 1],
    [-0.26, 0.98],
    [0.48, 0.83],
    [0.9, 0.62],
    [1, 0.49],
  ],
  rod: [
    [-1, 0.94],
    [-0.93, 1],
    [0.93, 1],
    [1, 0.94],
  ],
  cuff: [
    [-1, 0.84],
    [-0.66, 0.96],
    [-0.18, 1],
    [0.68, 0.98],
    [1, 0.85],
  ],
};

const makeMesh = (shape: Shape): Mesh => {
  const profile = [[-1.001, 0.001], ...profiles[shape], [1.001, 0.001]];
  const n = shape === "rod" ? 16 : 36,
    stride = 8,
    verts = new Float32Array(profile.length * (n + 1) * stride),
    triangles: number[] = [];
  const exponent = ["plate", "boot", "chest", "helmet"].includes(shape)
    ? 0.69
    : 1;
  const coord = (a: number, rad: number, y: number): V3 => [
    Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), exponent) * rad,
    y,
    Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), exponent) * rad,
  ];
  for (let j = 0; j < profile.length; j++) {
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU - Math.PI,
        k = (j * (n + 1) + i) * stride;
      const p = coord(a, profile[j][1], profile[j][0]);
      const pa = coord(a - 0.012, profile[j][1], profile[j][0]),
        pb = coord(a + 0.012, profile[j][1], profile[j][0]);
      const lo = profile[Math.max(0, j - 1)],
        hi = profile[Math.min(profile.length - 1, j + 1)];
      const p0 = coord(a, lo[1], lo[0]),
        p1 = coord(a, hi[1], hi[0]);
      const normal = norm(
        cross(
          [pb[0] - pa[0], 0, pb[2] - pa[2]],
          [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]],
        ),
      );
      verts.set([...p, ...normal, i / n, (1 - profile[j][0]) * 0.5], k);
      if (i < n && j < profile.length - 1) {
        const e = j * (n + 1) + i;
        triangles.push(e, e + 1, e + n + 1, e + 1, e + n + 2, e + n + 1);
      }
    }
  }
  return { vertices: verts, triangles: new Uint16Array(triangles) };
};

const colors: Record<Pigment, string> = {
  stone: "#b0aa89",
  ochre: "#b5a27a",
  sage: "#929a79",
  iron: "#6f776d",
  copper: "#9a8060",
  joint: "#61645b",
  lamp: "#f5cc72",
  ivory: "#c2b99a",
  dark: "#434d49",
};

function pigment(kind: Pigment, seed: number) {
  const s = 256,
    canvas = surface(s, s),
    c = canvas.getContext("2d")!,
    r = random(seed);
  const armor = ["stone", "sage", "ochre", "ivory"].includes(kind);
  c.fillStyle = colors[kind];
  c.fillRect(0, 0, s, s);
  if (kind !== "lamp") {
    for (let i = 0; i < 1050; i++) {
      const x = r() * s,
        y = r() * s,
        w = 1 + r() * 8,
        h = 1 + r() * 6;
      oval(
        c,
        x,
        y,
        w,
        h,
        i % 3
          ? `rgba(66,66,48,${r() * 0.045})`
          : `rgba(234,225,183,${r() * 0.08})`,
        (r() - 0.5) * 2,
      );
    }
    for (let i = 0; i < (armor ? 98 : 43); i++) {
      const x = r() * s,
        y = r() * s,
        w = r() * r() * 9 + 0.5,
        h = w * (0.12 + r() * 0.28);
      c.fillStyle = "rgba(67,66,48,.57)";
      c.beginPath();
      c.moveTo(x - w, y);
      c.lineTo(x - w * 0.4, y - h);
      c.lineTo(x + w, y - h * 0.5);
      c.lineTo(x + w * 0.3, y + h);
      c.closePath();
      c.fill();
      stroke(
        c,
        x - w,
        y + h,
        x + w * 0.3,
        y + h * 1.3,
        "rgba(235,226,180,.45)",
        0.7,
      );
    }
    for (let i = 0; i < 340; i++) {
      const x = r() * s,
        y = r() * s;
      stroke(
        c,
        x,
        y,
        x + r() * 4 - 2,
        y + r() * 6,
        r() > 0.45 ? "rgba(62,65,53,.26)" : "rgba(228,219,180,.65)",
        0.3 + r() * 0.5,
      );
    }
    if (armor) {
      for (const u of [0.15, 0.39, 0.7, 0.91]) {
        const x = u * s,
          kink = (r() - 0.5) * 19;
        c.beginPath();
        c.moveTo(x + kink, 0);
        c.lineTo(x + kink, 36);
        c.lineTo(x, 47);
        c.lineTo(x, 98);
        c.lineTo(x + 4, 105);
        c.lineTo(x + 4, 244);
        c.strokeStyle = "rgba(61,64,50,.72)";
        c.lineWidth = 1.3;
        c.stroke();
        for (const y of [24, 58, 218]) {
          oval(c, x + 3, y, 1.35, 1.7, "#686d59");
          oval(c, x + 3.2, y - 0.6, 0.85, 0.7, "#d2c8a2");
        }
      }
      for (let i = 0; i < 14; i++) {
        let x = r() * s,
          y = r() * s;
        c.beginPath();
        c.moveTo(x, y);
        for (let j = 0; j < 3 + r() * 4; j++) {
          x += (r() - 0.48) * 8;
          y += r() * 7;
          c.lineTo(x, y);
        }
        c.strokeStyle = "rgba(60,65,50,.62)";
        c.lineWidth = 0.6;
        c.stroke();
      }
      for (let i = 0; i < 700; i++) {
        const x = r() * s,
          y = Math.pow(r(), 3.5) * s * 0.4,
          k = r();
        if (
          Math.sin(x * 0.031 + seed) + Math.sin(x * 0.097 + y * 0.044) >
          -0.4
        ) {
          oval(
            c,
            x,
            y,
            0.8 + r() * 3.5,
            0.7 + r() * 2.2,
            k > 0.63 ? "rgba(108,124,62,.57)" : "rgba(76,93,55,.52)",
            r(),
          );
        }
      }
    }
    if (kind === "joint") {
      for (let y = 0; y < s; y += 28) {
        c.fillStyle = "#424b43";
        c.fillRect(0, y, s, 4);
        c.fillStyle = "#838477";
        c.fillRect(0, y + 4, s, 2);
      }
    }
  }
  const pixels = c.getImageData(0, 0, s, s);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const n = (r() + r() - 1) * (kind === "lamp" ? 3 : 12);
    pixels.data[i] += n;
    pixels.data[i + 1] += n;
    pixels.data[i + 2] += n;
  }
  return pixels.data;
}

const meshes = new Map<Shape, Mesh>(),
  textures = new Map<Pigment, Uint8ClampedArray>();
let buffer = new Float32Array(0);

// A small orthographic cel rasterizer: the armor, its painted marks, and its ink
// contours are reprojected together. There are no independent 2D limb layers.
export class InkRenderer {
  readonly width = 686;
  readonly height = 806;
  readonly pixelsPerUnit = 103;
  readonly originX = 343;
  readonly originY = 759;
  readonly canvas = surface(this.width, this.height);
  readonly context = this.canvas.getContext("2d")!;
  readonly depth = new Float32Array(this.width * this.height);
  private ids = new Uint16Array(this.width * this.height);
  private image = this.context.createImageData(this.width, this.height);
  private shadow = new Float32Array(448 * 448);
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;
  core = 0.4;

  project(p: V3): V3 {
    return [
      this.originX + p[0] * this.pixelsPerUnit,
      this.originY + (-p[1] * 0.996 + p[2] * 0.087) * this.pixelsPerUnit,
      p[2] * 0.996 + p[1] * 0.087,
    ];
  }

  render(pieces: Piece[]) {
    this.depth.fill(-1000);
    this.ids.fill(0);
    this.image.data.fill(0);
    this.shadow.fill(-1000);
    const emissive = pieces.map((p) => p.paint === "lamp");
    for (const piece of pieces) this.castShadow(piece);
    this.minX = this.width - 1;
    this.maxX = 1;
    this.minY = this.height - 1;
    this.maxY = 1;
    pieces.forEach((p, id) => this.draw(p, id + 1));
    const { width: w, depth: d, ids, image } = this;
    const data = image.data;
    for (
      let y = Math.max(1, this.minY);
      y < Math.min(this.height - 1, this.maxY + 1);
      y++
    ) {
      for (
        let x = Math.max(1, this.minX);
        x < Math.min(w - 1, this.maxX + 1);
        x++
      ) {
        const i = y * w + x;
        if (!ids[i]) continue;
        const vx = (x - this.originX) / this.pixelsPerUnit,
          vy = (y - this.originY) / this.pixelsPerUnit;
        const wy = -vy * 0.996 + d[i] * 0.087,
          wz = vy * 0.087 + d[i] * 0.996;
        const su = Math.round(224 + (vx * 0.416 - wz * 0.909) * 52),
          sv = Math.round(345 - (-vx * 0.691 + wy * 0.649 - wz * 0.316) * 52);
        if (
          !emissive[ids[i] - 1] &&
          su >= 0 &&
          su < 448 &&
          sv >= 0 &&
          sv < 448 &&
          this.shadow[sv * 448 + su] > vx * 0.59 + wy * 0.76 + wz * 0.27 + 0.074
        ) {
          const k = i * 4;
          data[k] = data[k] * 0.72 + 4;
          data[k + 1] = data[k + 1] * 0.75 + 4;
          data[k + 2] = data[k + 2] * 0.8 + 5;
        }
        const contour =
          !ids[i - 1] || !ids[i + 1] || !ids[i - w] || !ids[i + w];
        const seam =
          (ids[i - 1] !== ids[i] && d[i] - d[i - 1] > 0.026) ||
          (ids[i + w] !== ids[i] && d[i] - d[i + w] > 0.026);
        const crease = d[i] - d[i + 1] > 0.085 || d[i] - d[i + w] > 0.1;
        if (contour || seam || crease) {
          const k = contour ? 0.33 : seam ? 0.52 : 0.75;
          const t = i * 4;
          data[t] = data[t] * k + 13;
          data[t + 1] = data[t + 1] * k + 16;
          data[t + 2] = data[t + 2] * k + 13;
        }
      }
    }
    this.context.putImageData(image, 0, 0);
  }

  private castShadow(piece: Piece) {
    let mesh = meshes.get(piece.shape);
    if (!mesh) {
      mesh = makeMesh(piece.shape);
      meshes.set(piece.shape, mesh);
    }
    const v = mesh.vertices,
      n = v.length / 8,
      m = piece.matrix;
    if (buffer.length < n * 3) buffer = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) {
      const i = j * 8,
        x = v[i],
        y = v[i + 1],
        z = v[i + 2];
      const xx = m[0] * x + m[1] * y + m[2] * z + m[3],
        yy = m[4] * x + m[5] * y + m[6] * z + m[7],
        zz = m[8] * x + m[9] * y + m[10] * z + m[11];
      buffer[j * 3] = 224 + (xx * 0.416 - zz * 0.909) * 52;
      buffer[j * 3 + 1] = 345 - (-xx * 0.691 + yy * 0.649 - zz * 0.316) * 52;
      buffer[j * 3 + 2] = xx * 0.59 + yy * 0.76 + zz * 0.27;
    }
    const ix = mesh.triangles;
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3,
        b = ix[i + 1] * 3,
        c = ix[i + 2] * 3,
        x0 = buffer[a],
        y0 = buffer[a + 1];
      const x1 = buffer[b],
        y1 = buffer[b + 1],
        x2 = buffer[c],
        y2 = buffer[c + 1];
      const den = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
      if (den > -0.001) continue;
      const xlo = Math.max(0, Math.ceil(Math.min(x0, x1, x2))),
        xhi = Math.min(447, Math.floor(Math.max(x0, x1, x2)));
      const ylo = Math.max(0, Math.ceil(Math.min(y0, y1, y2))),
        yhi = Math.min(447, Math.floor(Math.max(y0, y1, y2)));
      const qx = (y2 - y0) / den,
        qy = -(x2 - x0) / den,
        px = -(y1 - y0) / den,
        py = (x1 - x0) / den;
      const z0 = buffer[a + 2],
        za = buffer[b + 2] - z0,
        zb = buffer[c + 2] - z0;
      for (let y = ylo; y <= yhi; y++) {
        let q = (xlo - x0) * qx + (y - y0) * qy,
          p = (xlo - x0) * px + (y - y0) * py;
        for (let x = xlo; x <= xhi; x++, q += qx, p += px) {
          if (q < 0 || p < 0 || q + p > 1) continue;
          const k = y * 448 + x,
            z = z0 + za * q + zb * p;
          if (z > this.shadow[k]) this.shadow[k] = z;
        }
      }
    }
  }

  private draw(piece: Piece, id: number) {
    const { matrix: m, shape, paint } = piece;
    let mesh = meshes.get(shape),
      tex = textures.get(paint);
    if (!mesh) {
      mesh = makeMesh(shape);
      meshes.set(shape, mesh);
    }
    if (!tex) {
      tex = pigment(
        paint,
        52 + [...paint].reduce((a, v) => a + v.charCodeAt(0), 0),
      );
      textures.set(paint, tex);
    }
    const v = mesh.vertices,
      tri = mesh.triangles,
      n = v.length / 8,
      sc = this.pixelsPerUnit;
    if (buffer.length < n * 6) buffer = new Float32Array(n * 6);
    const buf = buffer;
    // Inverse-transpose normal transform keeps the cel lights on the form, not the viewport.
    const na = [
      m[5] * m[10] - m[6] * m[9],
      m[6] * m[8] - m[4] * m[10],
      m[4] * m[9] - m[5] * m[8],
    ];
    const nb = [
      m[2] * m[9] - m[1] * m[10],
      m[0] * m[10] - m[2] * m[8],
      m[1] * m[8] - m[0] * m[9],
    ];
    const nc = [
      m[1] * m[6] - m[2] * m[5],
      m[2] * m[4] - m[0] * m[6],
      m[0] * m[5] - m[1] * m[4],
    ];
    for (let j = 0; j < n; j++) {
      const i = j * 8,
        k = j * 6,
        x = v[i],
        y = v[i + 1],
        z = v[i + 2];
      const px = m[0] * x + m[1] * y + m[2] * z + m[3],
        py = m[4] * x + m[5] * y + m[6] * z + m[7],
        pz = m[8] * x + m[9] * y + m[10] * z + m[11];
      buf[k] = this.originX + px * sc;
      buf[k + 1] = this.originY + (-py * 0.996 + pz * 0.087) * sc;
      buf[k + 2] = pz * 0.996 + py * 0.087;
      const nx = v[i + 3],
        ny = v[i + 4],
        nz = v[i + 5];
      const ax = na[0] * nx + na[1] * ny + na[2] * nz,
        ay = nb[0] * nx + nb[1] * ny + nb[2] * nz,
        az = nc[0] * nx + nc[1] * ny + nc[2] * nz;
      buf[k + 3] =
        (ax * 0.59 + ay * 0.76 + az * 0.27) /
        (Math.sqrt(ax * ax + ay * ay + az * az) || 1);
      buf[k + 4] = v[i + 6] * 255;
      buf[k + 5] = clamp(v[i + 7]) * 255;
    }
    const w = this.width,
      h = this.height,
      dep = this.depth,
      out = this.image.data,
      ids = this.ids,
      lamp = paint === "lamp";
    for (let tr = 0; tr < tri.length; tr += 3) {
      const a = tri[tr] * 6,
        b = tri[tr + 1] * 6,
        c = tri[tr + 2] * 6;
      const x0 = buf[a],
        y0 = buf[a + 1],
        x1 = buf[b],
        y1 = buf[b + 1],
        x2 = buf[c],
        y2 = buf[c + 1];
      const den = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
      if (den > -0.001) continue;
      const xlo = Math.max(0, Math.ceil(Math.min(x0, x1, x2))),
        xhi = Math.min(w - 1, Math.floor(Math.max(x0, x1, x2)));
      const ylo = Math.max(0, Math.ceil(Math.min(y0, y1, y2))),
        yhi = Math.min(h - 1, Math.floor(Math.max(y0, y1, y2)));
      if (xlo > xhi || ylo > yhi) continue;
      this.minX = Math.min(this.minX, xlo);
      this.maxX = Math.max(this.maxX, xhi);
      this.minY = Math.min(this.minY, ylo);
      this.maxY = Math.max(this.maxY, yhi);
      const inv = 1 / den,
        e1x = (y2 - y0) * inv,
        e1y = -(x2 - x0) * inv,
        e2x = -(y1 - y0) * inv,
        e2y = (x1 - x0) * inv;
      const z0 = buf[a + 2],
        za = buf[b + 2] - z0,
        zb = buf[c + 2] - z0;
      const l0 = buf[a + 3],
        la = buf[b + 3] - l0,
        lb = buf[c + 3] - l0;
      const u0 = buf[a + 4],
        ua = buf[b + 4] - u0,
        ub = buf[c + 4] - u0;
      const v0 = buf[a + 5],
        va = buf[b + 5] - v0,
        vb = buf[c + 5] - v0;
      for (let y = ylo; y <= yhi; y++) {
        let q = (xlo - x0) * e1x + (y - y0) * e1y,
          p = (xlo - x0) * e2x + (y - y0) * e2y;
        for (let x = xlo; x <= xhi; x++, q += e1x, p += e2x) {
          if (q < -0.0002 || p < -0.0002 || q + p > 1.0002) continue;
          const z = z0 + q * za + p * zb,
            k = y * w + x;
          if (z <= dep[k]) continue;
          dep[k] = z;
          ids[k] = id;
          const ti =
            ((((v0 + p * vb + q * va) | 0) & 255) * 256 +
              (((u0 + p * ub + q * ua) | 0) & 255)) *
            4;
          const light = l0 + q * la + p * lb;
          const value = lamp
            ? 0.88 + this.core * 0.25
            : light < -0.48
              ? 0.53
              : light < -0.17
                ? 0.64
                : light < 0.16
                  ? 0.77
                  : light < 0.51
                    ? 0.91
                    : light < 0.82
                      ? 1.04
                      : 1.15;
          const warm = light > 0.51 ? 7 : -2,
            i = k * 4;
          out[i] = tex[ti] * value + warm;
          out[i + 1] = tex[ti + 1] * value + 2;
          out[i + 2] = tex[ti + 2] * value + (light < 0.16 ? 6 : -2);
          out[i + 3] = 255;
        }
      }
    }
  }
}
