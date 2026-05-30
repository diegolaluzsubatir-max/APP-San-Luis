import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseFechaLocal(s: string): Date {
  const [y, m, d] = s.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

interface Context { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const {
    fecha, hora_inicio, hora_fin, lugar,
    entrenador, objetivo, observaciones,
  } = body as Record<string, unknown>;

  try {
    const e = await prisma.entrenamiento.update({
      where: { id: eid },
      data: {
        fecha:         parseFechaLocal(fecha as string),
        hora_inicio:   (hora_inicio as string) || "",
        hora_fin:      (hora_fin as string) || "",
        lugar:         (lugar as string) || "Cancha San Luis",
        entrenador:    (entrenador as string) || "Ernesto Fontes",
        objetivo:      (objetivo as string) || null,
        observaciones: (observaciones as string) || null,
      },
    });
    return NextResponse.json({ id: e.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/entrenamientos/:id]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    await prisma.asistenciaEntrenamiento.deleteMany({ where: { entrenamientoId: eid } });
    await prisma.entrenamiento.delete({ where: { id: eid } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/entrenamientos/:id]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
