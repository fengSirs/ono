// Deterministic 800x640 (5:4) share cover. No browser, font files or native dependencies.
import { deflateSync } from "node:zlib";
const glyphs = {
  O: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  N: ["11001", "11101", "11101", "11011", "11011", "11011", "11001"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  0: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};
const table = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(b) {
  let n = 0xffffffff;
  for (const v of b) n = table[(n ^ v) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    n = Buffer.alloc(4),
    c = Buffer.alloc(4);
  n.writeUInt32BE(data.length);
  c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([n, t, data, c]);
}
export function shareCover(code, capacity = 4) {
  const w = 800,
    h = 640,
    p = Buffer.alloc(w * h * 3);
  function rect(x, y, a, b, c) {
    for (let j = Math.max(0, y); j < Math.min(h, y + b); j++)
      for (let i = Math.max(0, x); i < Math.min(w, x + a); i++) {
        const q = (j * w + i) * 3;
        p[q] = c[0];
        p[q + 1] = c[1];
        p[q + 2] = c[2];
      }
  }
  const green = [32, 92, 71],
    cream = [255, 248, 229],
    gold = [237, 189, 84];
  rect(0, 0, w, h, green);
  rect(24, 24, 752, 592, gold);
  rect(28, 28, 744, 584, green);
  function text(s, x, y, scale, color) {
    for (const ch of s) {
      const rows = glyphs[ch] || glyphs["!"];
      rows.forEach((r, j) =>
        [...r].forEach((v, i) => {
          if (v === "1")
            rect(x + i * scale, y + j * scale, scale, scale, color);
        }),
      );
      x += 6 * scale;
    }
  }
  text("ONO!", 184, 76, 18, cream);
  const colors = [
    [173, 65, 75],
    [217, 171, 62],
    [69, 139, 102],
    [78, 128, 195],
  ];
  colors.slice(0, capacity).forEach((c, i) => {
    const x = 210 + i * 91;
    rect(x - 4, 252, 78, 106, cream);
    rect(x, 256, 70, 98, c);
  });
  rect(100, 401, 600, 137, cream);
  text(String(code).padStart(6, "0").slice(0, 6), 134, 434, 15, green);
  const scan = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    scan[y * (w * 3 + 1)] = 0;
    p.copy(scan, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scan)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
