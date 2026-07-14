// Generates the Mít Filipa PWA icons: a gold poker chip with an "F" on felt green.
// Pure Node (zlib for PNG deflate), no dependencies. Usage: node make_icons.mjs <outdir>
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outdir = process.argv[2] || '.';

/* ---------- minimal PNG encoder (8-bit RGB) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function png(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: truecolor
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- scene ---------- */
const C = {
  feltLight: [0x14, 0x50, 0x3e],
  feltDeep:  [0x06, 0x24, 0x19],
  gold:      [0xf0, 0xb4, 0x29],
  goldHi:    [0xf9, 0xd0, 0x6b],
  goldDeep:  [0xc7, 0x8d, 0x12],
  ink:       [0x1c, 0x2b, 0x22],
};
const mix = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);

// u, v in [0,1]; chipR = chip radius as a fraction of icon size
function sample(u, v, chipR) {
  // felt background, lit from the top like the app's body gradient
  const bgD = Math.hypot(u - 0.5, v - 0.1);
  let col = mix(C.feltLight, C.feltDeep, Math.min(1, bgD / 1.05));

  const dx = u - 0.5, dy = v - 0.5;
  const d = Math.hypot(dx, dy);
  if (d < chipR) {
    if (d > chipR * 0.86) {
      col = C.goldDeep; // rim
    } else {
      // chip face with a highlight toward the upper left
      const hl = Math.max(0, 1 - Math.hypot(dx + chipR * 0.35, dy + chipR * 0.4) / (chipR * 1.4));
      col = mix(C.gold, C.goldHi, hl * 0.9);
      // letter F, in chip-radius units (x right, y down)
      const x = dx / chipR, y = dy / chipR;
      const stem = x >= -0.34 && x <= -0.08 && y >= -0.44 && y <= 0.44;
      const top  = x >= -0.34 && x <=  0.38 && y >= -0.44 && y <= -0.20;
      const mid  = x >= -0.34 && x <=  0.26 && y >= -0.06 && y <=  0.16;
      if (stem || top || mid) col = C.ink;
    }
  }
  return col;
}

function render(size, chipR) {
  const SS = 4; // supersampling for antialiasing
  const rgb = Buffer.alloc(size * size * 3);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, chipR);
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
        }
      }
      const o = (py * size + px) * 3;
      rgb[o] = Math.round(acc[0] / (SS * SS));
      rgb[o + 1] = Math.round(acc[1] / (SS * SS));
      rgb[o + 2] = Math.round(acc[2] / (SS * SS));
    }
  }
  return png(size, rgb);
}

const targets = [
  ['icon-192.png', 192, 0.46],
  ['icon-512.png', 512, 0.46],
  ['icon-maskable-512.png', 512, 0.38], // chip inside the 40% maskable safe zone
  ['apple-touch-icon.png', 180, 0.44],
];
for (const [name, size, chipR] of targets) {
  writeFileSync(join(outdir, name), render(size, chipR));
  console.log('wrote', name);
}
