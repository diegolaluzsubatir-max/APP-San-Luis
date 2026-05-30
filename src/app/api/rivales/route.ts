import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rivales = await prisma.rival.findMany({
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(rivales);
}
