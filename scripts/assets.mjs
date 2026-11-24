import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { shareCover } from "../backend/src/share-cover.mjs";
export async function assets(root) {
  await mkdir(resolve(root, "miniapp/assets/audio"), { recursive: true });
  var cues = [
    "tap",
    "select",
    "play",
    "draw",
    "turn",
    "uno",
    "penalty",
    "skip",
    "reverse",
    "win",
    "error",
    "feed",
    "hatch",
    "pet",
    "success",
    "join",
    "start",
  ];
  for (let j = 0; j < cues.length; j++) {
    let rate = 16000,
      duration = ["win", "hatch", "success"].includes(cues[j]) ? 0.48 : 0.14,
      samples = Math.floor(rate * duration),
      buffer = Buffer.alloc(44 + samples * 2);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + samples * 2, 4);
    buffer.write("WAVEfmt ", 8);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(rate, 24);
    buffer.writeUInt32LE(rate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(samples * 2, 40);
    for (let i = 0; i < samples; i++) {
      let t = i / rate,
        f = 240 + j * 32,
        step = Math.floor(t / 0.12);
      if (duration > 0.2) f *= Math.pow(2, [0, 4, 7, 12][step % 4] / 12);
      let envelope = Math.min(1, t / 0.01) * Math.max(0, 1 - t / duration);
      let value = Math.sin(2 * Math.PI * f * t) * envelope * 0.24;
      buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
    }
    await writeFile(
      resolve(root, "miniapp/assets/audio", cues[j] + ".wav"),
      buffer,
    );
  }
  await writeFile(
    resolve(root, "miniapp/assets/invite-default.png"),
    shareCover("000000", 4),
  );
}
