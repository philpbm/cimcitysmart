import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

const EMETTEUR = "CIMSYSTEM";

/** Crée un secret TOTP et l'URI otpauth:// à afficher en QR code. */
export function nouveauSecret(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ issuer: EMETTEUR, label: email, algorithm: "SHA1", digits: 6, period: 30, secret });
  return { secretBase32: secret.base32, uri: totp.toString() };
}

/** Vérifie un code à 6 chiffres pour un secret base32 donné (fenêtre ±1). */
export function verifierCode(secretBase32: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({ issuer: EMETTEUR, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secretBase32) });
    const delta = totp.validate({ token: (code || "").replace(/\s/g, ""), window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

/** Génère N codes de secours, retourne {clairs, haches}. */
export async function codesDeSecours(n = 8) {
  const clairs: string[] = [];
  for (let i = 0; i < n; i++) clairs.push(Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6));
  const haches = await Promise.all(clairs.map((c) => bcrypt.hash(c, 10)));
  return { clairs, haches: JSON.stringify(haches) };
}

/** Vérifie un code de secours contre la liste hachée ; retourne la liste mise à jour ou null. */
export async function consommerCodeSecours(codesJSON: string | null, code: string): Promise<string | null> {
  if (!codesJSON) return null;
  let haches: string[];
  try { haches = JSON.parse(codesJSON); } catch { return null; }
  for (let i = 0; i < haches.length; i++) {
    if (await bcrypt.compare(code, haches[i])) {
      haches.splice(i, 1);
      return JSON.stringify(haches);
    }
  }
  return null;
}
