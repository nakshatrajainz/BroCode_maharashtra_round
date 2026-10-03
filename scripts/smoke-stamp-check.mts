/**
 * Offline smoke test for stamp → fingerprint → hidden id → verdict helpers.
 * Run: node --import tsx scripts/smoke-stamp-check.mts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PNG } from "pngjs";
import sharp from "sharp";
import { keccak256, toHex } from "viem";

// Load env so server-only modules that touch secrets don't explode if imported later.
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i);
  if (!(k in process.env)) process.env[k] = t.slice(i + 1);
}

const require = createRequire(import.meta.url);

// Inline the PNG helpers (avoid server-only import barrier in plain node).
const HIDDEN_KEY = "ModelLedger.Id";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readChunks(pngBytes) {
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= pngBytes.length) {
    const length = pngBytes.readUInt32BE(offset);
    const name = pngBytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = pngBytes.subarray(offset + 8, offset + 8 + length);
    chunks.push({ name, data: Buffer.from(data) });
    offset += 12 + length;
    if (name === "IEND") break;
  }
  return chunks;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunks(chunks) {
  const parts = [PNG_SIGNATURE];
  for (const chunk of chunks) {
    const type = Buffer.from(chunk.name, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(chunk.data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([type, chunk.data])), 0);
    parts.push(length, type, chunk.data, crc);
  }
  return Buffer.concat(parts);
}

function embed(pngBytes, hiddenId) {
  const chunks = readChunks(pngBytes).filter((c) => !(c.name === "tEXt" && c.data.toString("latin1").startsWith(HIDDEN_KEY)));
  const text = {
    name: "tEXt",
    data: Buffer.concat([Buffer.from(HIDDEN_KEY, "latin1"), Buffer.from([0]), Buffer.from(hiddenId, "latin1")]),
  };
  chunks.splice(chunks.findIndex((c) => c.name === "IEND"), 0, text);
  return writeChunks(chunks);
}

function extract(pngBytes) {
  for (const chunk of readChunks(pngBytes)) {
    if (chunk.name !== "tEXt") continue;
    const zero = chunk.data.indexOf(0);
    const key = chunk.data.subarray(0, zero).toString("latin1");
    if (key !== HIDDEN_KEY) continue;
    return chunk.data.subarray(zero + 1).toString("latin1");
  }
  return null;
}

function fingerprints(pngBytes) {
  const exact = keccak256(pngBytes);
  const png = PNG.sync.read(pngBytes);
  const sample = Buffer.alloc((32 * 32) << 2);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const srcX = Math.floor((x * png.width) / 32);
      const srcY = Math.floor((y * png.height) / 32);
      const src = (png.width * srcY + srcX) << 2;
      const dst = (32 * y + x) << 2;
      sample[dst] = png.data[src];
      sample[dst + 1] = png.data[src + 1];
      sample[dst + 2] = png.data[src + 2];
      sample[dst + 3] = png.data[src + 3];
    }
  }
  return { exact, lookalike: keccak256(sample) };
}

const hiddenId = toHex(Buffer.alloc(32, 7));
const jpeg = await sharp({
  create: { width: 48, height: 48, channels: 3, background: { r: 140, g: 47, b: 42 } },
}).jpeg().toBuffer();
const asPng = Buffer.from(await sharp(jpeg).ensureAlpha().png().toBuffer());
const stamped = embed(asPng, hiddenId.toLowerCase());

assert.equal(extract(stamped), hiddenId.toLowerCase());
PNG.sync.read(stamped); // throws if CRC/chunks broken
const a = fingerprints(stamped);
const b = fingerprints(stamped);
assert.equal(a.exact, b.exact);
assert.equal(a.lookalike, b.lookalike);
assert.notEqual(a.exact, a.lookalike);

// Re-check without re-encoding keeps exact match.
assert.equal(fingerprints(stamped).exact, a.exact);

console.log("smoke-stamp-check ok");
void require;
