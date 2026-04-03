/**
 * Generates the Apple client secret JWT required by Supabase.
 * Run: node scripts/generate-apple-secret.mjs
 *
 * Fill in the four constants below, then paste the output into
 * Supabase → Authentication → Providers → Apple → Secret Key.
 *
 * The JWT expires in 180 days — regenerate and update Supabase when it does.
 */

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

// ── Fill these in ─────────────────────────────────────────────────────────────
const P8_KEY_PATH = "./secrets/AuthKey_REPLACE.p8"; // drop your .p8 file in the secrets/ folder
const TEAM_ID     = "REPLACE_TEAM_ID";      // 10-char Apple Team ID
const KEY_ID      = "REPLACE_KEY_ID";       // Key ID shown in Apple Developer portal
const CLIENT_ID   = "REPLACE_SERVICES_ID";  // Services ID you created (e.g. com.simbasghost.pickup.auth)
// ─────────────────────────────────────────────────────────────────────────────

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

const privateKey = readFileSync(P8_KEY_PATH, "utf8");

const header  = b64url(Buffer.from(JSON.stringify({ alg: "ES256", kid: KEY_ID })));
const now     = Math.floor(Date.now() / 1000);
const payload = b64url(Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp: now + 15_552_000, // 180 days
  aud: "https://appleid.apple.com",
  sub: CLIENT_ID,
})));

const input = `${header}.${payload}`;
const sign  = createSign("SHA256");
sign.update(input);
const sig = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" }, "base64");
const signature = sig.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

console.log("\n── Apple Client Secret JWT ──────────────────────────────────────────────\n");
console.log(`${input}.${signature}`);
console.log("\n─────────────────────────────────────────────────────────────────────────");
console.log("Paste the above into: Supabase → Auth → Providers → Apple → Secret Key\n");
