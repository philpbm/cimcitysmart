import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await db.commandeQR.findMany({ orderBy: { cree: "desc" } }));
}

const schema = z.object({
  produit: z.string().min(1), defunt: z.string().optional(), prix: z.string().optional(),
  courriel: z.string().email().optional().or(z.literal("")), concessionRef: z.string().optional(),
  tribute: z.string().optional(),
});

/** Enregistre une commande de plaque QR (partenaire Forever Connected). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ erreur: parsed.error.flatten() }, { status: 400 });
  const q = parsed.data;
  let concessionId: string | null = null;
  if (q.concessionRef) concessionId = (await db.concession.findUnique({ where: { ref: q.concessionRef } }))?.id ?? null;
  const cmd = await db.commandeQR.create({
    data: { produit: q.produit, defunt: q.defunt || "", prix: q.prix || "", courriel: q.courriel || null, tribute: q.tribute || "", statut: "Commandé", concessionId },
  });
  return NextResponse.json(cmd, { status: 201 });
}
