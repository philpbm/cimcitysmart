// Couche d'accès aux données côté navigateur.
// Chaque appel est protégé : en cas d'échec (API indisponible, hors ligne,
// base non amorcée), on retourne null et l'interface retombe sur ses
// données de démonstration en mémoire. L'UI n'est jamais bloquée.

async function getJSON(url) {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? j : null;
  } catch {
    return null;
  }
}
async function postJSON(url, body) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Transforme une concession Prisma en enregistrement attendu par l'interface. */
export function mapConcession(k) {
  const parRole = (role) =>
    (k.personnes || [])
      .filter((p) => p.role === role)
      .map((p) => ({ nom: p.nom, prenom: p.prenom || "", nn: p.nn || "", lieu: p.lieuNaiss || "", naissance: p.naissance || "", adresse: p.adresse || "" }));
  return {
    ref: k.ref,
    cimetiere: (k.cimetiere && k.cimetiere.nom) || "",
    nature: k.nature,
    statut: k.statut,
    denom1: k.denom1 || "",
    denom2: k.denom2 || "",
    octroi: k.octroi || "",
    expiration: k.expiration || "",
    duree: k.duree || "",
    placesTot: k.placesTot ?? 1,
    placesOcc: k.placesOcc ?? 0,
    personnes: {
      concessionnaire: parRole("CONCESSIONNAIRE"),
      responsable: parRole("RESPONSABLE"),
      beneficiaire: parRole("BENEFICIAIRE"),
    },
    inhumes: (k.inhumations || []).map((i) => ({ nom: i.nom, naissance: i.naissance || "", deces: i.deces || "", inhum: i.dateInhum || "", pf: i.pompesFunebres || "" })),
    monument: k.monument ? { placeur: k.monument.marbrier || "", sculpteur: k.monument.sculpteur || "", materiau: k.monument.materiau || "", etat: k.monument.etat || "" } : {},
    sihl: null,
    _db: true,
  };
}

/** Concessions depuis la base (mappées). null si indisponible → repli démo. */
export async function chargerConcessions() {
  const rows = await getJSON("/api/concessions");
  if (!rows) return null;
  try {
    return rows.map(mapConcession);
  } catch {
    return null;
  }
}

export async function chargerDeliberations() {
  const rows = await getJSON("/api/deliberations");
  if (!rows) return null;
  return rows.map((d) => ({
    id: d.id, extId: d.extId, objet: d.objet, type: d.type, cat: d.categorie || "",
    groupe: d.groupe || "", meetingDate: d.seanceDate || "À déterminer",
    statut: d.statut || "Envoyé", date: (d.cree || "").slice(0, 10),
  }));
}

export async function envoyerDeliberation(p) {
  return postJSON("/api/deliberations", {
    extId: p.extId, objet: p.objet, type: p.type,
    categorie: p.cat, groupe: p.groupe, seanceDate: p.meetingDate,
    concessionRef: (p.extId || "").split("/").slice(1).join("/").replace("-", "/"),
  });
}

export async function chargerCommandesQR() {
  const rows = await getJSON("/api/commandes-qr");
  if (!rows) return null;
  return rows.map((o) => ({
    id: o.id, ref: o.concessionId || "", defunt: o.defunt, produit: o.produit,
    prix: o.prix, statut: o.statut, tribute: o.tribute, email: o.courriel || "",
    date: (o.cree || "").slice(0, 10),
  }));
}

export async function envoyerCommandeQR(o) {
  return postJSON("/api/commandes-qr", {
    produit: o.produit, defunt: o.defunt, prix: o.prix,
    courriel: o.email || "", tribute: o.tribute, concessionRef: o.ref || "",
  });
}

/** Authentification réelle (obtient une session serveur si le compte existe). */
export async function connexion(email, motDePasse) {
  return postJSON("/api/connexion", { email, motDePasse });
}
export async function verifierMfa(code) {
  return postJSON("/api/connexion/verification", { code });
}

/** Persiste une concession créée dans l'interface. */
export async function envoyerConcession(rec) {
  const roles = { concessionnaire: "CONCESSIONNAIRE", responsable: "RESPONSABLE", beneficiaire: "BENEFICIAIRE" };
  const personnes = [];
  const P = rec.personnes || {};
  Object.keys(roles).forEach((k) => {
    (P[k] || []).forEach((p) => personnes.push({
      role: roles[k], nom: p.nom || "", prenom: p.prenom || "",
      nn: p.nn || "", lieuNaiss: p.lieu || "", naissance: p.naissance || "", adresse: p.adresse || "",
    }));
  });
  return postJSON("/api/concessions", {
    ref: rec.ref, cimetiere: rec.cimetiere, nature: rec.nature, statut: rec.statut,
    denom1: rec.denom1 || "", denom2: rec.denom2 || "", octroi: rec.octroi, expiration: rec.expiration,
    duree: rec.duree, placesTot: rec.placesTot, placesOcc: rec.placesOcc, personnes,
  });
}

/** Persiste une déclaration de décès (module Décès). */
export async function envoyerDeclaration(d) {
  return postJSON("/api/declarations", d);
}

/** Met à jour une concession en base (édition de dossier). */
export async function majConcession(ref, patch) {
  const champs = ["nature", "statut", "denom1", "denom2", "octroi", "expiration", "duree", "placesTot", "placesOcc"];
  const body = { ref };
  champs.forEach((k) => { if (patch && patch[k] !== undefined) body[k] = patch[k]; });
  if (Object.keys(body).length === 1) return null; // rien à mettre à jour
  try {
    const r = await fetch("/api/concessions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** MFA : prépare (sans code) puis confirme (avec code) la double authentification. */
export async function preparerMfa() {
  try {
    const r = await fetch("/api/mfa/activer", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
export async function confirmerMfa(code) {
  try {
    const r = await fetch("/api/mfa/activer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    return r.ok;
  } catch { return false; }
}
