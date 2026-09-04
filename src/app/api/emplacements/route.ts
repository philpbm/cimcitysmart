import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GeoJSON des emplacements. ?cimetiere=<nom> pour restreindre à un cimetière. */
export async function GET(req: Request) {
  const cimetiere = new URL(req.url).searchParams.get("cimetiere");
  const where = cimetiere ? { cimetiere } : {};
  const rows = await db.emplacement.findMany({ where, take: 20000 });
  const features = rows.map((r) => {
    let coords: any = [];
    try { coords = JSON.parse(r.geo); } catch {}
    return {
      type: "Feature",
      properties: { e_emplacement: r.ref, cim_nom: r.cimetiere, cim_code: r.cimCode },
      geometry: { type: "MultiPolygon", coordinates: coords },
    };
  });
  return NextResponse.json({ type: "FeatureCollection", features });
}
