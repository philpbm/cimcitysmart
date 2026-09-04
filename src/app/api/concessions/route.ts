import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liste filtrable des concessions. Query : ?cimetiere=&nature=&statut=&q= */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const where: any = {};
  if (p.get("cimetiere")) where.cimetiere = { nom: p.get("cimetiere") };
  if (p.get("nature")) where.nature = p.get("nature");
  if (p.get("statut")) where.statut = p.get("statut");
  const q = (p.get("q") || "").trim();
  if (q) where.OR = [
    { ref: { contains: q, mode: "insensitive" } },
    { denom1: { contains: q, mode: "insensitive" } },
    { inhumations: { some: { nom: { contains: q, mode: "insensitive" } } } },
    { personnes: { some: { nom: { contains: q, mode: "insensitive" } } } },
  ];
  const concessions = await db.concession.findMany({
    where, orderBy: { ref: "asc" }, take: 10000,
    include: { cimetiere: true, personnes: true, inhumations: true, monument: true },
  });
  return NextResponse.json(concessions);
}

const personneSchema = z.object({
  role: z.string(), nom: z.string(), prenom: z.string().optional(),
  nn: z.string().optional(), lieuNaiss: z.string().optional(),
  naissance: z.string().optional(), adresse: z.string().optional(),
});
const schema = z.object({
  ref: z.string().min(1), cimetiere: z.string().min(1),
  nature: z.string(), statut: z.string().optional(),
  denom1: z.string().optional(), denom2: z.string().optional(),
  octroi: z.string().optional(), expiration: z.string().optional(), duree: z.string().optional(),
  placesTot: z.number().optional(), placesOcc: z.number().optional(),
  personnes: z.array(personneSchema).optional(),
});

/** Crée une concession (avec ses personnes). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ erreur: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const cim = await db.cimetiere.upsert({
    where: { nom: d.cimetiere }, update: {}, create: { nom: d.cimetiere, commune: "Namur" },
  });
  const rec = await db.concession.create({
    data: {
      ref: d.ref, cimetiereId: cim.id, nature: d.nature, statut: d.statut || "octroyee",
      denom1: d.denom1 || "", denom2: d.denom2 || "", octroi: d.octroi, expiration: d.expiration,
      duree: d.duree, placesTot: d.placesTot ?? 1, placesOcc: d.placesOcc ?? 0,
      personnes: d.personnes && d.personnes.length ? { create: d.personnes } : undefined,
    },
    include: { cimetiere: true, personnes: true, inhumations: true, monument: true },
  });
  return NextResponse.json(rec, { status: 201 });
}

/** Met à jour une concession (par ref). Body partiel. */
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ref = body.ref;
  if (!ref) return NextResponse.json({ erreur: "ref requise." }, { status: 400 });
  const data: any = {};
  for (const k of ["nature", "statut", "denom1", "denom2", "octroi", "expiration", "duree", "placesTot", "placesOcc"]) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  try {
    const rec = await db.concession.update({ where: { ref }, data });
    return NextResponse.json(rec);
  } catch {
    return NextResponse.json({ erreur: "Concession introuvable." }, { status: 404 });
  }
}
