import { NextResponse } from "next/server";
import { amorcerGeometrie } from "@/lib/amorcage";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Charge la géométrie des emplacements. Protégé par CLE_AMORCAGE.
 *  Appel : /api/amorcage-geo?cle=VOTRE_CLE  (à lancer après /api/amorcage). */
export async function GET(req: Request) {
  const cle = new URL(req.url).searchParams.get("cle");
  if (!process.env.CLE_AMORCAGE) return NextResponse.json({ erreur: "CLE_AMORCAGE non configurée." }, { status: 500 });
  if (cle !== process.env.CLE_AMORCAGE) return NextResponse.json({ erreur: "Clé invalide." }, { status: 403 });
  try {
    const bilan = await amorcerGeometrie();
    return NextResponse.json({ ok: true, bilan });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e?.message || e) }, { status: 500 });
  }
}
