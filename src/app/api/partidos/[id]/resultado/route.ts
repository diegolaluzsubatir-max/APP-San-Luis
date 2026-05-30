import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pid = parseInt(id);
  if (isNaN(pid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { goles_local, goles_visita } = await req.json();

  await prisma.partido.update({
    where: { id: pid },
    data: { goles_local, goles_visita, estado: "jugado" },
  });

  return NextResponse.json({ ok: true });
}
