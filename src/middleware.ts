import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protège les écritures (POST/PATCH/DELETE) sur /api/* et la page /donnees.
// Les lectures (GET) restent ouvertes pour la démonstration.
// Exceptions d'écriture : /api/connexion, /api/connexion/verification, /api/amorcage.

const OUVERT = new Set([
  "/api/connexion",
  "/api/connexion/verification",
  "/api/amorcage",
]);

async function aUneSession(req: NextRequest): Promise<boolean> {
  const jeton = req.cookies.get("cim_session")?.value;
  const s = process.env.AUTH_SECRET;
  if (!jeton || !s || s.length < 32) return false;
  try {
    await jwtVerify(jeton, new TextEncoder().encode(s));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const methode = req.method.toUpperCase();
  const ecriture = methode === "POST" || methode === "PATCH" || methode === "PUT" || methode === "DELETE";

  // Écritures API protégées (hors exceptions)
  if (pathname.startsWith("/api/") && ecriture && !OUVERT.has(pathname)) {
    if (!(await aUneSession(req))) {
      return NextResponse.json({ erreur: "Authentification requise." }, { status: 401 });
    }
  }

  // La page de démonstration base de données requiert une session
  if (pathname === "/donnees") {
    if (!(await aUneSession(req))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/donnees"],
};
