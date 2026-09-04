import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await db.deliberation.findMany({ orderBy: { cree: "desc" } }));
}

const schema = z.object({
  extId: z.string().min(1), objet: z.string().min(1),
  type: z.enum(["meeting-config-college", "meeting-config-council"]),
  categorie: z.string().optional(), groupe: z.string().optional(),
  seanceDate: z.string().optional(), concessionRef: z.string().optional(),
});

/** Crée un point de délibération (correspond à createItem / POST @item côté iA.Délib). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ erreur: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  let concessionId: string | null = null;
  if (d.concessionRef) concessionId = (await db.concession.findUnique({ where: { ref: d.concessionRef } }))?.id ?? null;
  const point = await db.deliberation.create({
    data: { extId: d.extId, objet: d.objet, type: d.type, categorie: d.categorie || "", groupe: d.groupe || "", seanceDate: d.seanceDate, statut: "Envoyé", concessionId },
  });
  return NextResponse.json(point, { status: 201 });
}
