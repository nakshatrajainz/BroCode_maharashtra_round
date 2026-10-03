import "server-only";

import { PNG } from "pngjs";
import { keccak256, type Hex } from "viem";

const HIDDEN_KEY = "ModelLedger.Id";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

type Chunk = { name: string; data: Buffer };

export function buildPreparedPng() {
  const width = 640;
  const height = 400;
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      const band = Math.floor(x / 80) % 2 === 0;
      png.data[i] = band ? 140 : 245;
      png.data[i + 1] = band ? 47 : 241;
      png.data[i + 2] = band ? 42 : 232;
      png.data[i + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

export function embedHiddenId(pngBytes: Buffer, hiddenId: Hex) {
  assertPng(pngBytes);
  const chunks = readChunks(pngBytes).filter((chunk) => !(chunk.name === "tEXt" && textKey(chunk.data) === HIDDEN_KEY));
  const textChunk: Chunk = {
    name: "tEXt",
    data: Buffer.concat([Buffer.from(HIDDEN_KEY, "latin1"), Buffer.from([0]), Buffer.from(hiddenId.toLowerCase(), "latin1")]),
  };
  const iend = chunks.findIndex((chunk) => chunk.name === "IEND");
  if (iend < 0) throw new Error("PNG is missing IEND.");
  chunks.splice(iend, 0, textChunk);
  return writeChunks(chunks);
}

export function extractHiddenId(pngBytes: Buffer): Hex | null {
  try {
    assertPng(pngBytes);
    for (const chunk of readChunks(pngBytes)) {
      if (chunk.name !== "tEXt") continue;
      if (textKey(chunk.data) !== HIDDEN_KEY) continue;
      const value = textValue(chunk.data);
      if (/^0x[0-9a-f]{64}$/i.test(value)) return value.toLowerCase() as Hex;
    }
  } catch {
    return null;
  }
  return null;
}

export function fingerprintsForPng(pngBytes: Buffer): {
  exactFingerprint: Hex;
  lookalikeFingerprint: Hex;
} {
  const exactFingerprint = keccak256(pngBytes);
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

  return {
    exactFingerprint,
    lookalikeFingerprint: keccak256(sample),
  };
}

export function toDownloadName(companyName: string) {
  const safe = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "picture";
  return `${safe}-stamped.png`;
}

export function bufferToDataUrl(pngBytes: Buffer) {
  return `data:image/png;base64,${pngBytes.toString("base64")}`;
}

export function assertPng(bytes: Buffer) {
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Only PNG pictures are supported in this phase.");
  }
}

function textKey(data: Buffer) {
  const zero = data.indexOf(0);
  return data.subarray(0, zero < 0 ? data.length : zero).toString("latin1");
}

function textValue(data: Buffer) {
  const zero = data.indexOf(0);
  return zero < 0 ? "" : data.subarray(zero + 1).toString("latin1");
}

function readChunks(pngBytes: Buffer): Chunk[] {
  const chunks: Chunk[] = [];
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

function writeChunks(chunks: Chunk[]) {
  const parts: Buffer[] = [PNG_SIGNATURE];
  for (const chunk of chunks) {
    const type = Buffer.from(chunk.name, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(chunk.data.length, 0);
    const crc = Buffer.alloc(4);
    const body = Buffer.concat([type, chunk.data]);
    crc.writeUInt32BE(crc32(body), 0);
    parts.push(length, type, chunk.data, crc);
  }
  return Buffer.concat(parts);
}

function crc32(buffer: Uint8Array) {
  const table = crcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]!)! & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let cachedTable: Uint32Array | null = null;
function crcTable() {
  if (cachedTable) return cachedTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  cachedTable = table;
  return table;
}
