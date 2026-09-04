import { NextResponse } from "next/server";
import { sessionCourante } from "@/lib/auth";
import { nouveauSecret, verifierCode, codesDeSecours } from "@/lib/mfa";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sans body : prépare un secret + QR + codes de secours (mfaActive reste false).
 *  Avec { code } : confirme et active la 2FA. */
export async function POST(req: Request) {
  const s = await sessionCourante();
  if (!s) return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (!body.code) {
    const { secretBase32, uri } = nouveauSecret(s.email);
    const { clairs, haches } = await codesDeSecours();
    await db.utilisateur.update({ where: { id: s.id }, data: { mfaSecret: secretBase32, mfaCodes: haches, mfaActive: false } });
    return NextResponse.json({ uri, secret: secretBase32, codesDeSecours: clairs });
  }

  const u = await db.utilisateur.findUnique({ where: { id: s.id } });
  if (!u?.mfaSecret || !verifierCode(u.mfaSecret, String(body.code))) {
    return NextResponse.json({ erreur: "Code invalide." }, { status: 400 });
  }
  await db.utilisateur.update({ where: { id: s.id }, data: { mfaActive: true, mfaActiveLe: new Date() } });
  return NextResponse.json({ ok: true });
}
