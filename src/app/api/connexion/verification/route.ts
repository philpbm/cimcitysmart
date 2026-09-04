import { NextResponse } from "next/server";
import { idEnAttenteMfa, ouvrirSession } from "@/lib/auth";
import { verifierCode, consommerCodeSecours } from "@/lib/mfa";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const id = await idEnAttenteMfa();
  if (!id) return NextResponse.json({ erreur: "Session expirée, recommencez." }, { status: 401 });
  const { code } = await req.json().catch(() => ({}));
  const u = await db.utilisateur.findUnique({ where: { id } });
  if (!u || !u.mfaSecret) return NextResponse.json({ erreur: "Compte introuvable." }, { status: 401 });

  let ok = verifierCode(u.mfaSecret, String(code || ""));
  if (!ok) {
    const restants = await consommerCodeSecours(u.mfaCodes, String(code || ""));
    if (restants !== null) { ok = true; await db.utilisateur.update({ where: { id }, data: { mfaCodes: restants } }); }
  }
  if (!ok) return NextResponse.json({ erreur: "Code invalide." }, { status: 401 });
  await ouvrirSession({ id: u.id, email: u.email, nom: u.nom, role: u.role });
  return NextResponse.json({ ok: true });
}
