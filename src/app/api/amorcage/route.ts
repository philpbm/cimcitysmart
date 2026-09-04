import { NextResponse } from "next/server";
import { amorcer } from "@/lib/amorcage";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Remplit la base à distance. Protégé par CLE_AMORCAGE.
 *  Appel : https://votre-site/api/amorcage?cle=VOTRE_CLE  (idempotent) */
export async function GET(req: Request) {
  const cle = new URL(req.url).searchParams.get("cle");
  const attendue = process.env.CLE_AMORCAGE;
  if (!attendue) return NextResponse.json({ erreur: "CLE_AMORCAGE non configurée." }, { status: 500 });
  if (cle !== attendue) return NextResponse.json({ erreur: "Clé invalide." }, { status: 403 });
  try {
    const bilan = await amorcer();
    return NextResponse.json({ ok: true, bilan });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e?.message || e) }, { status: 500 });
  }
}
