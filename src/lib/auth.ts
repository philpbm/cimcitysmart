import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const NOM_COOKIE = "cim_session";
const NOM_COOKIE_MFA = "cim_mfa"; // mot de passe validé, code TOTP attendu
const DUREE = 60 * 60 * 8; // 8 heures
const DUREE_MFA = 60 * 5; // 5 minutes pour saisir le code

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court. Générez-en un avec : openssl rand -base64 32");
  }
  return new TextEncoder().encode(s);
}

export type Session = { id: string; email: string; nom: string; role: string };

export async function verifierMotDePasse(email: string, motDePasse: string): Promise<Session | null> {
  const u = await db.utilisateur.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!u) {
    await bcrypt.compare(motDePasse, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return null;
  }
  const ok = await bcrypt.compare(motDePasse, u.motDePasse);
  if (!ok) return null;
  return { id: u.id, email: u.email, nom: u.nom, role: u.role };
}

export async function ouvrirSession(s: Session) {
  const jeton = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(NOM_COOKIE, jeton, {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", path: "/", maxAge: DUREE,
  });
  jar.delete(NOM_COOKIE_MFA);
}

/** Jeton intermédiaire : mot de passe validé, code TOTP attendu. */
export async function ouvrirEtapeMfa(id: string) {
  const jeton = await new SignJWT({ id, etape: "mfa" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(`${DUREE_MFA}s`).sign(secret());
  const jar = await cookies();
  jar.set(NOM_COOKIE_MFA, jeton, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DUREE_MFA });
}

export async function idEnAttenteMfa(): Promise<string | null> {
  const jar = await cookies();
  const jeton = jar.get(NOM_COOKIE_MFA)?.value;
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret());
    return payload.etape === "mfa" ? String(payload.id) : null;
  } catch { return null; }
}

export async function fermerSession() {
  const jar = await cookies();
  jar.delete(NOM_COOKIE);
}

export async function sessionCourante(): Promise<Session | null> {
  const jar = await cookies();
  const jeton = jar.get(NOM_COOKIE)?.value;
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret());
    return { id: String(payload.id), email: String(payload.email), nom: String(payload.nom), role: String(payload.role) };
  } catch {
    return null;
  }
}
