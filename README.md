# CIMSYSTEM — application full-stack (Next.js + Prisma + PostgreSQL/Neon)

Gestion cartographique des cimetières — **D2D3.com SA**.
Même architecture que *mekong-insider* : **Next.js 15 (App Router) · TypeScript · Prisma ·
PostgreSQL (Neon) · Tailwind · déploiement Vercel**. Conventions et noms en français.

---

## 1. Prérequis
- **Node.js 18+** (20 conseillé) et npm.
- Un compte **Neon** (base PostgreSQL serverless) : https://neon.tech
- Un compte **Vercel** pour le déploiement : https://vercel.com

## 2. Base de données Neon
1. Neon → **New Project** (région Europe, ex. *eu-central-1*).
2. **Connect** → copiez l'URL **« Pooled connection »** (elle contient `-pooler`).
3. Elle servira de `DATABASE_URL` (gardez `?sslmode=require`).

## 3. Configuration
```bash
cp .env.example .env
```
Renseignez dans `.env` :
- `DATABASE_URL` = l'URL Neon *pooled*.
- `AUTH_SECRET` = `openssl rand -base64 32`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` = compte gestionnaire initial.
- `CLE_AMORCAGE` = un mot de passe long (amorçage à distance).

## 4. Démarrage en local
```bash
npm install
npm run setup     # = prisma db push (crée les tables) + seed (Namur + démo)
npm run dev       # http://localhost:3000
```
- **Interface complète** : http://localhost:3000
- **Preuve base de données** (rendu serveur, lecture Prisma) : http://localhost:3000/donnees
- Connexion gestionnaire : `ADMIN_EMAIL` / `ADMIN_PASSWORD` (via `POST /api/connexion`).

Commandes utiles : `npm run db:studio` (explorateur Prisma), `npm run db:push`,
`npm run db:seed`.

## 5. Déploiement sur Vercel
1. Poussez le dossier sur **GitHub**.
2. Vercel → **Add New → Project** → importez le dépôt (framework détecté : Next.js).
3. **Settings → Environment Variables** : ajoutez `DATABASE_URL`, `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLE_AMORCAGE` (mêmes valeurs que `.env`).
4. **Deploy.** Le build lance `prisma generate && next build`.
5. Une fois en ligne, **amorcez la base** en ouvrant une fois :
   `https://VOTRE-DOMAINE/api/amorcage?cle=CLE_AMORCAGE` (idempotent).

> Astuce : Neon + Vercel s'intègrent aussi via *Vercel → Storage → Neon*, qui injecte
> `DATABASE_URL` automatiquement.

## 6. Structure
```
prisma/
  schema.prisma        modèle de données (Cimetiere, Concession, Personne,
                       Inhumation, Monument, Deliberation, CommandeQR, Utilisateur)
  seed.ts              amorçage en ligne de commande
src/
  lib/
    db.ts              client Prisma (singleton)
    auth.ts            sessions JWT (jose) + mots de passe (bcrypt)
    graine.ts          jeu de démonstration (cimetières de Namur + concessions)
    amorcage.ts        insertion idempotente en base
  app/
    page.tsx           monte l'interface CIMSYSTEM (client)
    donnees/page.tsx   page serveur qui LIT la base (preuve de bout en bout)
    api/
      connexion/       POST — authentification
      cimetieres/      GET  — liste des cimetières
      concessions/     GET  — concessions filtrables (?cimetiere=&nature=&statut=&q=)
      deliberations/   GET/POST — points iA.Délib (createItem)
      commandes-qr/    GET/POST — commandes de plaques QR (Forever Connected)
      amorcage/        GET  — remplit la base (protégé par CLE_AMORCAGE)
  cimsystem/App.jsx    interface complète (Plan, Concessions, Décès, iA.Délib,
                       QR mémoriels, Portail public, etc.)
```

## 7. Interface reliée à la base
Au démarrage, l'interface interroge la base et bascule automatiquement dessus
quand elle répond (sinon elle reste sur ses données de démonstration — jamais bloquée) :
- **Concessions** : liste chargée depuis `/api/concessions` (badge vert « base de
  données ») ; **créer une concession écrit en base** (POST).
- **Délibérations (iA.Délib)** : liste depuis `/api/deliberations` ; créer un point
  **écrit en base** (POST) — équivalent de `createItem` côté iMio.
- **QR mémoriels (Forever Connected)** : liste depuis `/api/commandes-qr` ; passer une
  commande **écrit en base** (POST).
- **Décès** : une déclaration envoyée par une entreprise de pompes funèbres est
  **enregistrée en base** (POST `/api/declarations`).

La couche d'accès (`src/cimsystem/api.js`) protège chaque appel et retombe sur la démo.

## 7bis. Authentification & sécurité
- **Connexion réelle** : l'écran de login appelle `POST /api/connexion`
  (email = identifiant, mot de passe). Avec le compte gestionnaire créé à l'amorçage,
  une **session signée (JWT/jose)** est ouverte ; les mots de passe sont **hachés (bcrypt)**.
- **Double authentification (TOTP)** : `POST /api/mfa/activer` prépare un secret + un QR
  `otpauth://` + des codes de secours, puis confirme l'activation. À la connexion suivante,
  `POST /api/connexion` renvoie `mfaRequired`, et `POST /api/connexion/verification`
  valide le code (Google Authenticator, etc.) ou un code de secours.
- **Middleware** (`src/middleware.ts`) : toute **écriture** API (POST/PATCH/DELETE) exige
  une session (sauf `connexion`, `verification`, `amorcage`) ; la page `/donnees` est
  protégée. Les lectures restent ouvertes pour la démonstration — resserrez-les en
  ajoutant les routes GET voulues au middleware le jour de la mise en production.

> En démonstration (login `p.baijot` / `demo`), aucune session serveur n'est créée :
> l'interface fonctionne mais les écritures ne sont pas persistées. Connectez-vous avec
> le **compte gestionnaire** (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) pour écrire réellement.

## 8. Notes
- **Réseau requis en ligne** pour les fonds de carte (OSM/Esri), les couches SPW
  Géoportail wallon, l'open data de Namur et l'aperçu des QR.
- Sécurité : mots de passe hachés (bcrypt), sessions signées (JWT/jose), champs TOTP
  prévus sur `Utilisateur` pour activer la double authentification.

© D2D3.com SA — Route de Hannut 531, 5024 Namur — info@d2d3.com
