import bcrypt from "bcryptjs";
import { db } from "./db";
import gerpinnes from "./gerpinnes.json";
import emplacementsData from "./emplacements.json";

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Remplit la base avec les données de la commune (Gerpinnes, anonymisées).
 * Idempotent : efface les cimetières/concessions existants puis réinsère.
 * Le compte gestionnaire est préservé.
 */
export async function amorcer() {
  const g = gerpinnes as any;
  const bilan: Record<string, number> = {};

  // 1) Compte gestionnaire
  const email = (process.env.ADMIN_EMAIL || "admin@gerpinnes.be").toLowerCase().trim();
  const motDePasse = process.env.ADMIN_PASSWORD || "changez-moi";
  await db.utilisateur.upsert({
    where: { email }, update: {},
    create: { email, nom: "Gestionnaire", role: "ADMIN", motDePasse: await bcrypt.hash(motDePasse, 10) },
  });
  bilan.utilisateurs = 1;

  // 2) Purge des données existantes (dans l'ordre des dépendances)
  await db.inhumation.deleteMany({});
  await db.personne.deleteMany({});
  await db.monument.deleteMany({});
  await db.commandeQR.deleteMany({});
  await db.deliberation.deleteMany({});
  await db.concession.deleteMany({});
  await db.cimetiere.deleteMany({});

  // 3) Insertion Gerpinnes (par lots)
  await db.cimetiere.createMany({ data: g.cimetieres, skipDuplicates: true });
  bilan.cimetieres = g.cimetieres.length;

  for (const part of chunk(g.concessions, 500))
    await db.concession.createMany({ data: part, skipDuplicates: true });
  bilan.concessions = g.concessions.length;

  // filet de sécurité : ne garder que les enfants dont la concession existe bien
  const ids = new Set((await db.concession.findMany({ select: { id: true } })).map((c) => c.id));
  const personnes = (g.personnes as any[]).filter((p) => ids.has(p.concessionId));
  const inhumations = (g.inhumations as any[]).filter((i) => ids.has(i.concessionId));

  for (const part of chunk(personnes, 1000))
    await db.personne.createMany({ data: part, skipDuplicates: true });
  bilan.personnes = personnes.length;

  for (const part of chunk(inhumations, 1000))
    await db.inhumation.createMany({ data: part, skipDuplicates: true });
  bilan.inhumations = inhumations.length;

  return bilan;
}

/** Charge la géométrie des emplacements (séparé pour éviter les délais serverless). */
export async function amorcerGeometrie() {
  await db.emplacement.deleteMany({});
  const empl = (emplacementsData as any[]).map((e) => ({
    ref: e.ref, cimetiere: e.cimetiere, cimCode: e.cimCode || "", geo: JSON.stringify(e.coords),
  }));
  for (const part of chunk(empl, 400))
    await db.emplacement.createMany({ data: part, skipDuplicates: true });
  return { emplacements: empl.length };
}
