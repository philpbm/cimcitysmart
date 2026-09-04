import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Page rendue côté serveur : elle lit RÉELLEMENT la base (Prisma → Neon).
// Preuve que l'application est adossée à une base de données PostgreSQL.
export default async function Donnees() {
  let cimetieres: any[] = [];
  let concessions: any[] = [];
  let erreur = "";
  try {
    cimetieres = await db.cimetiere.findMany({ orderBy: { nom: "asc" }, include: { _count: { select: { concessions: true } } } });
    concessions = await db.concession.findMany({ take: 50, orderBy: { ref: "asc" }, include: { cimetiere: true } });
  } catch (e: any) {
    erreur = String(e?.message || e);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "Inter, sans-serif", color: "#1E2733" }}>
      <h1 style={{ color: "#CD0947" }}>CIMSYSTEM — données en base (Neon / PostgreSQL)</h1>
      {erreur ? (
        <p style={{ color: "#b00" }}>
          Base non disponible : {erreur}. Vérifiez <code>DATABASE_URL</code> puis lancez l&apos;amorçage
          (<code>npm run setup</code> ou <code>/api/amorcage?cle=…</code>).
        </p>
      ) : (
        <>
          <p>{cimetieres.length} cimetières · {concessions.length} concessions affichées (50 max).</p>
          <h2>Cimetières</h2>
          <ul>{cimetieres.map((c) => (<li key={c.id}><b>{c.nom}</b> — {c.commune} · {c._count.concessions} concessions</li>))}</ul>
          <h2>Concessions</h2>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}><th>Réf.</th><th>Cimetière</th><th>Nature</th><th>Statut</th><th>Dénomination</th></tr></thead>
            <tbody>{concessions.map((k) => (<tr key={k.id} style={{ borderBottom: "1px solid #f0f0f0" }}><td>{k.ref}</td><td>{k.cimetiere?.nom}</td><td>{k.nature}</td><td>{k.statut}</td><td>{k.denom1}</td></tr>))}</tbody>
          </table>
        </>
      )}
    </main>
  );
}
