import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseFechaLocal(s: string): Date {
  const [y, m, d] = s.split("T")[0].split("-").map(Number);
  const timePart = s.includes("T") ? s.split("T")[1] : "12:00";
  const [h, min] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, h || 12, min || 0, 0);
}

export async function POST(req: NextRequest) {
  const { fecha, rival, rivalId, lugar, condicion, campeonato } = await req.json();
  if (!fecha || !rival) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const partido = await prisma.partido.create({
    data: {
      fecha:      parseFechaLocal(fecha),
      rival,
      rivalId:    rivalId ?? null,
      lugar:      lugar || null,
      condicion,
      campeonato: campeonato || null,
      duracion:   50,
      estado:     "pendiente",
    },
  });

  // Auto-generate planning for all fichados
  const jugadores = await prisma.jugador.findMany({
    where: { fichado: true, estado: "activo" },
    orderBy: { numero_camiseta: "asc" },
  });
  const ids = jugadores.map((j) => j.id);
  const minPorCuarto = partido.duracion / 4;
  const asignaciones: Record<number, number[]> = {};
  for (const id of ids) asignaciones[id] = [];
  let idx = 0;
  for (let c = 1; c <= 4; c++) {
    for (let s = 0; s < 9; s++) {
      asignaciones[ids[idx % ids.length]].push(c);
      idx++;
    }
  }
  for (const id of ids) {
    await prisma.participacionPartido.create({
      data: {
        partidoId: partido.id,
        jugadorId: id,
        cuartos:   JSON.stringify(asignaciones[id]),
        minutos:   asignaciones[id].length * minPorCuarto,
      },
    });
  }

  return NextResponse.json({ id: partido.id });
}
