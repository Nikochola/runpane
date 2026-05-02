import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { deriveNextSeed, fromHex, toHex } from "./util.js";

// noble-ed25519 needs sha512 sync hook
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export type RatchetState = {
  /** Current seed (32 bytes hex). Treat as private. */
  seedHex: string;
  /** Current public key derived from seed (hex). */
  publicKeyHex: string;
  /** Generation counter. Starts at 0. */
  n: number;
};

export async function genesis(): Promise<RatchetState> {
  const seed = ed.utils.randomPrivateKey();
  const pub = await ed.getPublicKeyAsync(seed);
  return { seedHex: toHex(seed), publicKeyHex: toHex(pub), n: 0 };
}

export async function fromSeed(seedHex: string, n = 0): Promise<RatchetState> {
  const seed = fromHex(seedHex);
  const pub = await ed.getPublicKeyAsync(seed);
  return { seedHex, publicKeyHex: toHex(pub), n };
}

export async function sign(state: RatchetState, message: Uint8Array): Promise<string> {
  const sig = await ed.signAsync(message, fromHex(state.seedHex));
  return toHex(sig);
}

export async function verify(
  publicKeyHex: string,
  signatureHex: string,
  message: Uint8Array,
): Promise<boolean> {
  try {
    return await ed.verifyAsync(fromHex(signatureHex), message, fromHex(publicKeyHex));
  } catch {
    return false;
  }
}

/**
 * Advance the ratchet using the receipt hash from the just-completed action.
 * The previous seed is overwritten — the old key is gone.
 */
export async function advance(state: RatchetState, receiptHash: string): Promise<RatchetState> {
  const nextSeed = deriveNextSeed(fromHex(state.seedHex), receiptHash);
  const pub = await ed.getPublicKeyAsync(nextSeed);
  return { seedHex: toHex(nextSeed), publicKeyHex: toHex(pub), n: state.n + 1 };
}
