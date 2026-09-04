# Déployer CIMSYSTEM sur Vercel (+ base Neon) — guide pas à pas

Durée : ~15 minutes. Aucune ligne de commande obligatoire (tout se fait dans le
navigateur), sauf pour générer le secret.

---

## Étape 0 — Ce qu'il vous faut
- Un compte **GitHub**  (github.com)
- Un compte **Neon**    (neon.tech) — base PostgreSQL gratuite
- Un compte **Vercel**  (vercel.com)

---

## Étape 1 — Créer la base sur Neon
1. neon.tech → **New Project**. Nom : `cimsystem`. Région : **Europe (Frankfurt)**.
2. Une fois créé, cliquez **Connect**.
3. Choisissez **Connection string** → **Pooled connection**.
4. **Copiez** l'URL. Elle ressemble à :
   `postgresql://user:pass@ep-xxxx-pooler.eu-central-1.aws.neon.tech/cimsystem?sslmode=require`
   Gardez-la de côté (c'est votre `DATABASE_URL`).

## Étape 2 — Mettre le code sur GitHub
1. github.com → **New repository** → nom `cimsystem` → **Private** → *Create*.
2. Sur la page du dépôt : **Add file → Upload files**.
3. Glissez **tout le contenu** du dossier décompressé (les fichiers ET dossiers :
   `prisma`, `src`, `package.json`, `next.config.ts`, `vercel.json`, etc.).
   ⚠️ N'incluez PAS `node_modules` ni `.next` (ils ne sont pas dans le zip, c'est normal).
4. **Commit changes**.

## Étape 3 — Générer le secret de session
Sur votre machine (Terminal / PowerShell) :
```bash
openssl rand -base64 32
```
Copiez le résultat (ce sera `AUTH_SECRET`). Pas d'openssl ? Utilisez n'importe quelle
chaîne aléatoire d'au moins 32 caractères.

## Étape 4 — Importer dans Vercel
1. vercel.com → **Add New… → Project**.
2. **Import** votre dépôt GitHub `cimsystem` (autorisez GitHub si demandé).
3. Framework : **Next.js** (détecté automatiquement). Ne touchez pas au reste.
4. Dépliez **Environment Variables** et ajoutez ces 5 variables :

   | Name            | Value                                             |
   |-----------------|---------------------------------------------------|
   | `DATABASE_URL`  | l'URL Neon *pooled* de l'étape 1                  |
   | `AUTH_SECRET`   | le secret de l'étape 3                            |
   | `ADMIN_EMAIL`   | ex. `admin@gerpinnes.be`                          |
   | `ADMIN_PASSWORD`| un mot de passe fort                              |
   | `CLE_AMORCAGE`  | un mot de passe long et aléatoire                 |

5. Cliquez **Deploy**. Le build lance `prisma generate → prisma db push → next build`
   ( **il crée automatiquement les tables** dans Neon ). Comptez 2–3 minutes.

## Étape 5 — Remplir la base (une seule fois)
Quand le déploiement affiche **Ready**, ouvrez dans le navigateur :
```
https://VOTRE-DOMAINE.vercel.app/api/amorcage?cle=VOTRE_CLE_AMORCAGE
```
(remplacez par votre domaine Vercel et votre `CLE_AMORCAGE`).
Vous devez voir un JSON `{"ok":true,"bilan":{...}}`. L'opération est **idempotente**
(la relancer ne crée pas de doublons).

## Étape 6 — Vérifier
- Application : `https://VOTRE-DOMAINE.vercel.app`
  Connectez-vous avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` (les écritures sont alors
  persistées en base).
- Preuve base de données (lecture serveur) :
  `https://VOTRE-DOMAINE.vercel.app/donnees`

---

## Charger les données réelles de Gerpinnes (facultatif)
Le déploiement se remplit avec un jeu de démonstration. Pour injecter le jeu réel
(paquet `gerpinnes-REEL-dataset` / `gerpinnes-ANONYME-dataset`) dans la même base Neon :
```bash
# géométrie (couche carto)
pg_restore -d "DATABASE_URL_non_pooled" sql/cim_saphir_empl_ben.backup
# ou depuis le shapefile :
shp2pgsql -s 31300 -I shp/gerpinnes_emplacements cim_saphir_empl_ben | psql "DATABASE_URL"
```
> Pour `pg_restore`/`psql`, utilisez de préférence l'URL **non-pooled** de Neon
> (onglet *Connect* → *Direct connection*), plus adaptée aux gros imports.

---

## Dépannage
- **Build échoue sur `prisma db push`** → `DATABASE_URL` absente ou mal copiée dans
  Vercel (vérifiez les guillemets, le `?sslmode=require`). Redéployez après correction.
- **`/api/amorcage` renvoie 403** → la `cle` de l'URL ne correspond pas à `CLE_AMORCAGE`.
- **`/api/amorcage` renvoie 500 "AUTH_SECRET…"** → `AUTH_SECRET` manquant / trop court.
- **Page blanche + `/donnees` redirige** → normal si non connecté ; `/donnees` exige une
  session. Connectez-vous d'abord dans l'application.
- **Timeout Neon au premier appel** → la base « dort » ; réessayez, elle se réveille.
- **Modifier une variable** → Vercel → Project → Settings → Environment Variables →
  *Redeploy* pour appliquer.

## Domaine personnalisé (facultatif)
Vercel → Project → **Settings → Domains** → ajoutez `cimetieres.gerpinnes.be`
(puis suivez les instructions DNS).
