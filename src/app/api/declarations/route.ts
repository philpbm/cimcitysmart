import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await db.declaration.findMany({ orderBy: { cree: "desc" }, take: 300 }));
}

const schema = z.object({
  defuntNom: z.string().min(1),
  defuntNaissance: z.string().optional(), defuntDeces: z.string().optional(),
  operateurPF: z.string().optional(), typeCeremonie: z.string().optional(),
  cimetiere: z.string().optional(), concessionRef: z.string().optional(),
  dateSouhaitee: z.string().optional(), statut: z.string().optional(), notes: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ erreur: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const rec = await db.declaration.create({ data: {
    defuntNom: d.defuntNom, defuntNaissance: d.defuntNaissance, defuntDeces: d.defuntDeces,
    operateurPF: d.operateurPF || "", typeCeremonie: d.typeCeremonie || "",
    cimetiere: d.cimetiere, concessionRef: d.concessionRef, dateSouhaitee: d.dateSouhaitee,
    statut: d.statut || "recue", notes: d.notes,
  } });
  return NextResponse.json(rec, { status: 201 });
}
