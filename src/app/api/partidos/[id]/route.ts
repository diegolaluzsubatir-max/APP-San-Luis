import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pid = parseInt(id);
  if (isNaN(pid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { estado, notas } = await req.json();

  await prisma.partido.update({
    where: { id: pid },
    data: { estado, notas: notas ?? null },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pid = parseInt(id);
  if (isNaN(pid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // No hay onDelete: Cascade en el schema, hay que borrar la planificación primero
  await prisma.participacionPartido.deleteMany({ where: { partidoId: pid } });
  await prisma.partido.delete({ where: { id: pid } });

  return NextResponse.json({ ok: true });
}
