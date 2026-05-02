import { blake3 } from "@noble/hashes/blake3";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

export const enc = new TextEncoder();
export const dec = new TextDecoder();

export function toHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function fromHex(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function hash(data: Uint8Array | string): string {
  const b = typeof data === "string" ? enc.encode(data) : data;
  return toHex(blake3(b));
}

export function canonical(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonical).join(",") + "]";
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonical((obj as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

export function hashObject(obj: unknown): string {
  return hash(canonical(obj));
}

export function deriveNextSeed(currentSeed: Uint8Array, receiptHash: string): Uint8Array {
  // HKDF: extract+expand. salt = receiptHash, ikm = currentSeed.
  return hkdf(sha256, currentSeed, fromHex(receiptHash), enc.encode("runpane/ratchet/v1"), 32);
}
