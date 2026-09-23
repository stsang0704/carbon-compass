import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const paper = [243, 239, 230, 255];
const ink = [28, 25, 21, 255];
const needle = [194, 65, 45, 255];

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([Buffer.from(type), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function paint(x, y, size) {
  const cx = (size - 1) / 2;
  const cy = cx;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const radius = size * 0.36;
  const ring = Math.abs(dist - radius) < size * 0.012;
  const hub = dist < size * 0.028;
  const pointing =
    dy < -size * 0.02 &&
    Math.abs(dx) < size * 0.045 * (1 - Math.abs(dy) / (size * 0.42)) &&
    dy > -size * 0.34;
  if (pointing) return needle;
  if (ring || hub) return ink;
  return paper;
}

const out = path.resolve("public");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "pwa-192.png"), png(192, paint));
fs.writeFileSync(path.join(out, "pwa-512.png"), png(512, paint));
fs.writeFileSync(path.join(out, "apple-touch-icon.png"), png(180, paint));
