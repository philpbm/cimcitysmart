import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const cimetieres = await db.cimetiere.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { concessions: true } } },
  });
  return NextResponse.json(cimetieres);
}
