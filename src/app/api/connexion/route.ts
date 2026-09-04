import { NextResponse } from "next/server";
import { verifierMotDePasse, ouvrirSession, ouvrirEtapeMfa } from "@/lib/auth";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, motDePasse } = await req.json().catch(() => ({}));
  const s = await verifierMotDePasse(String(email || ""), String(motDePasse || ""));
  if (!s) return NextResponse.json({ erreur: "Identifiants invalides." }, { status: 401 });
  const u = await db.utilisateur.findUnique({ where: { id: s.id } });
  if (u?.mfaActive) {
    await ouvrirEtapeMfa(s.id);
    return NextResponse.json({ ok: true, mfaRequired: true });
  }
  await ouvrirSession(s);
  return NextResponse.json({ ok: true, nom: s.nom, role: s.role });
}
