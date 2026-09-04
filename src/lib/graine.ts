// Générateur déterministe du jeu de démonstration (données en clair, illustratives).
// Utilisé par prisma/seed.ts (CLI) et par /api/amorcage (à distance).

export const CIMETIERES = [
  { nom: "Belgrade", commune: "Namur", lat: 50.4732, lng: 4.8344 },
  { nom: "Bouge", commune: "Namur", lat: 50.4789, lng: 4.8889 },
  { nom: "Saint-Servais", commune: "Namur", lat: 50.472, lng: 4.843 },
  { nom: "Jambes", commune: "Namur", lat: 50.4575, lng: 4.8722 },
  { nom: "Bomel", commune: "Namur", lat: 50.4715, lng: 4.8665 },
  { nom: "Malonne", commune: "Namur", lat: 50.4399, lng: 4.82 },
];

const CIM_BY_ALLEE: Record<string, string> = {
  ALM: "Belgrade", BRT: "Bouge", CHE: "Saint-Servais", DUM: "Jambes", GIS: "Bomel", MAL: "Malonne",
};
const NATURES = ["pleine_terre", "caveau", "columbarium", "cavurne", "dispersion", "pelouse_honneur"];
const STATUTS = ["octroyee", "octroyee", "octroyee", "renouvellement", "echue", "reprise"];
const NOMS = ["DETRY", "LECOMTE", "RENARD", "CLOSSET", "MARTIN", "SIMON", "WAUTELET", "DUBOIS", "COLLIN", "COUNSON", "SERVAIS", "BODY", "GÉRARD", "DUPONT", "DETHIER", "LAMBERT", "MASSART", "HENRY", "PIRARD", "BASTIN", "LEROY", "HUBERT", "BERTRAND", "DELVAUX"];
const PRENOMS = ["Rose", "Gaston", "Fernand", "Gabrielle", "André", "Louis", "Denise", "Marcel", "Yvonne", "Camille", "Jean", "Élise", "Henri", "Léa", "Robert", "Anne", "Victor", "Madeleine"];
const MARBRIERS = ["Marbrerie Dubois", "Pirard & Fils", "Ateliers Servais", "Granits Namurois"];
const PF = ["PF Lemaire", "PF Namuroise", "Pompes Funèbres Servais", "PF du Confluent"];

function mulberry(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];
const annee = (r: () => number, a: number, b: number) => a + Math.floor(r() * (b - a));
const jj = (r: () => number) => String(1 + Math.floor(r() * 28)).padStart(2, "0");
const mm = (r: () => number) => String(1 + Math.floor(r() * 12)).padStart(2, "0");

export type ConcessionGraine = ReturnType<typeof genererConcessions>[number];

export function genererConcessions() {
  const alleys = Object.keys(CIM_BY_ALLEE);
  const out: any[] = [];
  alleys.forEach((prefix, ai) => {
    const n = prefix === "MAL" ? 6 : 12;
    for (let i = 1; i <= n; i++) {
      const r = mulberry(1000 * (ai + 1) + i);
      const ref = `${prefix}/T${i}`;
      const nature = pick(r, NATURES);
      const statut = pick(r, STATUTS);
      const nom1 = pick(r, NOMS), nom2 = pick(r, NOMS);
      const oct = annee(r, 1990, 2020);
      const duree = pick(r, ["15 ans", "30 ans", "50 ans", "Perpétuelle"]);
      const dur = duree === "Perpétuelle" ? 0 : parseInt(duree);
      const placesTot = nature === "caveau" ? 4 : nature === "columbarium" ? 2 : 1;
      const placesOcc = Math.min(placesTot, 1 + Math.floor(r() * placesTot));
      const personnes = [
        { role: "CONCESSIONNAIRE", nom: `${nom1} ${pick(r, PRENOMS)}`, prenom: pick(r, PRENOMS), nn: `${annee(r, 30, 99)}.${mm(r)}.${jj(r)}-${100 + Math.floor(r() * 800)}.${10 + Math.floor(r() * 80)}`, lieuNaiss: "Namur", naissance: `${jj(r)}/${mm(r)}/${annee(r, 1935, 1975)}`, adresse: `rue des Champs ${1 + Math.floor(r() * 80)}, 5000 Namur` },
        { role: "RESPONSABLE", nom: `${nom2} ${pick(r, PRENOMS)}`, prenom: pick(r, PRENOMS), naissance: `${jj(r)}/${mm(r)}/${annee(r, 1940, 1980)}` },
        { role: "BENEFICIAIRE", nom: `${nom1} ${pick(r, PRENOMS)}`, naissance: `${annee(r, 1955, 1990)}` },
      ];
      const inhumations = statut === "libre" ? [] : Array.from({ length: placesOcc }, () => {
        const nais = annee(r, 1920, 1955); const dec = annee(r, oct, oct + 25);
        return { nom: `${pick(r, PRENOMS)} ${nom1}`, naissance: `${jj(r)}/${mm(r)}/${nais}`, deces: `${jj(r)}/${mm(r)}/${dec}`, dateInhum: `${jj(r)}/${mm(r)}/${dec}`, pompesFunebres: pick(r, PF) };
      });
      out.push({
        ref, cimetiere: CIM_BY_ALLEE[prefix], nature, statut,
        denom1: statut === "libre" ? "Emplacement libre" : `Famille ${nom1} – ${nom2}`,
        denom2: r() > 0.7 ? `dite « ${pick(r, ["Au Repos", "Souvenir", "Mémoire"])} »` : "",
        octroi: `${jj(r)}/${mm(r)}/${oct}`, expiration: dur ? String(oct + dur) : "—", duree,
        placesTot, placesOcc, personnes, inhumations,
        monument: { marbrier: pick(r, MARBRIERS), materiau: pick(r, ["Granit", "Pierre bleue", "Marbre"]), etat: pick(r, ["Bon", "Correct", "À surveiller"]) },
      });
    }
  });
  return out;
}

export const DELIBERATIONS = [
  { extId: "CIM/REP/BRT-T12", objet: "Reprise de la concession BRT/T12 (état d'abandon — CDLD L1232-12)", type: "meeting-config-council", categorie: "Cimetières — reprises (décision)", groupe: "Service Cimetières", statut: "Inscrit (séance)", seanceDate: "25/08/2026" },
  { extId: "CIM/EXH/DUM-T1", objet: "Autorisation d'exhumation — concession DUM/T1", type: "meeting-config-college", categorie: "Cimetières — exhumations", groupe: "Service Population — État civil", statut: "Envoyé", seanceDate: "01/07/2026" },
];

export const COMMANDES_QR = [
  { refConcession: "ALM/T3", defunt: "HUBERT Marcel", produit: "Arbre de Vie", prix: "99,95 €", statut: "Activé (page en ligne)", tribute: "https://qreb.eu/m/almt3", courriel: "famille.hubert@example.be" },
  { refConcession: "BRT/T4", defunt: "BERTRAND Jeanne", produit: "Coquelicots rouges", prix: "99,95 €", statut: "Commandé", tribute: "https://qreb.eu/m/brtt4", courriel: "j.bertrand@example.be" },
];
