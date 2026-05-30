import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const partidoId = parseInt(id);
  if (isNaN(partidoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const partido = await prisma.partido.findUnique({
    where: { id: partidoId },
    include: {
      planificacion: {
        include: { jugador: true },
      },
    },
  });

  if (!partido) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const jugadoresFichados = await prisma.jugador.findMany({
    where: { fichado: true, estado: "activo" },
    orderBy: [{ numero_camiseta: "asc" }, { apellido: "asc" }],
  });

  return NextResponse.json({ partido, jugadoresFichados });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const partidoId = parseInt(id);
  if (isNaN(partidoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json();
  const { participaciones } = body as {
    participaciones: { jugadorId: number; cuartos: number[] }[];
  };

  const MIN_POR_CUARTO = 12.5; // 50 min / 4 cuartos

  await prisma.participacionPartido.deleteMany({ where: { partidoId } });

  for (const p of participaciones) {
    await prisma.participacionPartido.create({
      data: {
        partidoId,
        jugadorId: p.jugadorId,
        cuartos: JSON.stringify(p.cuartos),
        minutos: p.cuartos.length * MIN_POR_CUARTO,
      },
    });
  }

  await prisma.partido.update({
    where: { id: partidoId },
    data: { duracion: 50 },
  });

  return NextResponse.json({ ok: true });
}
