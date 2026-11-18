export type Ctx = CanvasRenderingContext2D;
export type V3 = [number, number, number];
export type Mat = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
export const TAU = Math.PI * 2;
export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, n: number) => {
  const x = clamp((n - a) / (b - a));
  return x * x * (3 - 2 * x);
};
export function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function surface(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
export function oval(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  a = 0,
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), a, 0, TAU);
  c.fill();
}
export function stroke(
  c: Ctx,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
export function leaf(
  c: Ctx,
  x: number,
  y: number,
  length: number,
  breadth: number,
  angle: number,
  color: string,
) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(
    x + dx * length * 0.48 - dy * breadth,
    y + dy * length * 0.48 + dx * breadth,
    x + dx * length,
    y + dy * length,
  );
  c.quadraticCurveTo(
    x + dx * length * 0.6 + dy * breadth * 0.65,
    y + dy * length * 0.6 - dx * breadth * 0.65,
    x,
    y,
  );
  c.fillStyle = color;
  c.fill();
}
export const identity: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
export const trans = (x: number, y: number, z: number): Mat => [
  1,
  0,
  0,
  x,
  0,
  1,
  0,
  y,
  0,
  0,
  1,
  z,
];
export const scale = (x: number, y = x, z = x): Mat => [
  x,
  0,
  0,
  0,
  0,
  y,
  0,
  0,
  0,
  0,
  z,
  0,
];
export const rx = (a: number): Mat => [
  1,
  0,
  0,
  0,
  0,
  Math.cos(a),
  -Math.sin(a),
  0,
  0,
  Math.sin(a),
  Math.cos(a),
  0,
];
export const ry = (a: number): Mat => [
  Math.cos(a),
  0,
  Math.sin(a),
  0,
  0,
  1,
  0,
  0,
  -Math.sin(a),
  0,
  Math.cos(a),
  0,
];
export const rz = (a: number): Mat => [
  Math.cos(a),
  -Math.sin(a),
  0,
  0,
  Math.sin(a),
  Math.cos(a),
  0,
  0,
  0,
  0,
  1,
  0,
];
export function mul(a: Mat, b: Mat): Mat {
  const out: Mat = [...identity];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] =
        a[i * 4] * b[j] +
        a[i * 4 + 1] * b[4 + j] +
        a[i * 4 + 2] * b[8 + j] +
        (j === 3 ? a[i * 4 + 3] : 0);
    }
  }
  return out;
}
export const chain = (...m: Mat[]) => m.reduce(mul, identity);
export const point = (m: Mat, v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3],
  m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7],
  m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11],
];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const vmix = (a: V3, b: V3, t: number): V3 => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
export function between(a: V3, b: V3): Mat {
  const dy: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const y = norm(dy),
    x = norm(cross(y, Math.abs(y[2]) > 0.94 ? [1, 0, 0] : [0, 0, 1])),
    z = cross(x, y);
  return [
    x[0],
    dy[0] / 2,
    z[0],
    (a[0] + b[0]) / 2,
    x[1],
    dy[1] / 2,
    z[1],
    (a[1] + b[1]) / 2,
    x[2],
    dy[2] / 2,
    z[2],
    (a[2] + b[2]) / 2,
  ];
}
