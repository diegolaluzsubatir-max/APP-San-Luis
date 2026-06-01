import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseFechaLocal(s: string): Date {
  const [y, m, d] = s.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // mediodía local, evita cruce de medianoche UTC
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  console.log("[POST /api/entrenamientos] body:", JSON.stringify(body, null, 2));

  const {
    fecha, hora_inicio, hora_fin,
    lugar, entrenador, objetivo, observaciones, tipo,
  } = body as Record<string, unknown>;

  if (!fecha) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });

  try {
    const e = await prisma.entrenamiento.create({
      data: {
        fecha:         parseFechaLocal(fecha as string),
        hora_inicio:   (hora_inicio as string) || "",
        hora_fin:      (hora_fin as string) || "",
        lugar:         (lugar as string) || "Cancha San Luis",
        entrenador:    (entrenador as string) || "Ernesto Fontes",
        objetivo:      (objetivo as string) || null,
        observaciones: (observaciones as string) || null,
        tipo:          (tipo as string) || "obligatorio",
        estado:        "planificado",
      },
    });

    return NextResponse.json({ id: e.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/entrenamientos] Prisma error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
