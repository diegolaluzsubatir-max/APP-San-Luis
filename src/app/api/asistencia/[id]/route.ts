import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { registros } = await req.json() as {
    registros: { jugadorId: number; estado: string; observaciones: string }[];
  };

  await prisma.asistenciaEntrenamiento.deleteMany({ where: { entrenamientoId: eid } });
  await prisma.asistenciaEntrenamiento.createMany({
    data: registros.map((r) => ({
      entrenamientoId: eid,
      jugadorId:       r.jugadorId,
      estado:          r.estado,
      observaciones:   r.observaciones || null,
    })),
  });

  return NextResponse.json({ ok: true });
}
