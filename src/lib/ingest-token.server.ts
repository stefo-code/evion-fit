import { createHash, randomBytes } from "node:crypto";

/** Token-Format: vk_<32 hex> – gespeichert wird nur der SHA-256-Hash. */
export function erzeugeToken() {
  const raw = `vk_${randomBytes(24).toString("hex")}`;
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 9) };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
