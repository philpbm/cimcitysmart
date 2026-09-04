import bcrypt from "bcryptjs";
import { db } from "./db";
import { CIMETIERES, genererConcessions, DELIBERATIONS, COMMANDES_QR } from "./graine";

/**
 * Remplit la base de démonstration. Idempotent : relançable sans doublons.
 * Retourne un petit compte-rendu.
 */
export async function amorcer() {
  const bilan: Record<string, number> = {};

  // 1) Compte gestionnaire
  const email = (process.env.ADMIN_EMAIL || "admin@namur.be").toLowerCase().trim();
  const motDePasse = process.env.ADMIN_PASSWORD || "changez-moi";
  await db.utilisateur.upsert({
    where: { email },
    update: {},
    create: { email, nom: "Gestionnaire", role: "ADMIN", motDePasse: await bcrypt.hash(motDePasse, 10) },
  });
  bilan.utilisateurs = 1;

  // 2) Cimetières
  const idCim: Record<string, string> = {};
  for (const c of CIMETIERES) {
    const rec = await db.cimetiere.upsert({
      where: { nom: c.nom }, update: { commune: c.commune, lat: c.lat, lng: c.lng },
      create: { nom: c.nom, commune: c.commune, lat: c.lat, lng: c.lng },
    });
    idCim[c.nom] = rec.id;
  }
  bilan.cimetieres = CIMETIERES.length;

  // 3) Concessions + personnes + inhumations + monument
  const concessions = genererConcessions();
  const idConc: Record<string, string> = {};
  for (const k of concessions) {
    const rec = await db.concession.upsert({
      where: { ref: k.ref },
      update: {},
      create: {
        ref: k.ref, cimetiereId: idCim[k.cimetiere], nature: k.nature, statut: k.statut,
        denom1: k.denom1, denom2: k.denom2, octroi: k.octroi, expiration: k.expiration,
        duree: k.duree, placesTot: k.placesTot, placesOcc: k.placesOcc,
        personnes: { create: k.personnes },
        inhumations: { create: k.inhumations },
        monument: { create: k.monument },
      },
    });
    idConc[k.ref] = rec.id;
  }
  bilan.concessions = concessions.length;

  // 4) Délibérations
  for (const d of DELIBERATIONS) {
    const ref = d.extId.split("/").slice(1).join("/").replace("-", "/");
    await db.deliberation.upsert({
      where: { extId: d.extId }, update: {},
      create: { extId: d.extId, objet: d.objet, type: d.type, categorie: d.categorie, groupe: d.groupe, statut: d.statut, seanceDate: d.seanceDate, concessionId: idConc[ref] || null },
    });
  }
  bilan.deliberations = DELIBERATIONS.length;

  // 5) Commandes QR
  for (const q of COMMANDES_QR) {
    const cid = idConc[q.refConcession] || null;
    const existe = await db.commandeQR.findFirst({ where: { defunt: q.defunt, produit: q.produit } });
    if (!existe) {
      await db.commandeQR.create({ data: { concessionId: cid, defunt: q.defunt, produit: q.produit, prix: q.prix, statut: q.statut, tribute: q.tribute, courriel: q.courriel } });
    }
  }
  bilan.commandesQR = COMMANDES_QR.length;

  return bilan;
}
