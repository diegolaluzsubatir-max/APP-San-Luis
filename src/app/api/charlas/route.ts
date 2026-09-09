import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarCharla, getCharlaById } from "@/lib/charlas";

// POST /api/charlas  { jugadorId, fecha, etiqueta?, temas[] }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const jid = Number(body.jugadorId);
    if (!Number.isInteger(jid)) return NextResponse.json({ error: "jugadorId inválido" }, { status: 400 });

    const v = validarCharla(body);
    if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
    const { fecha, etiqueta, temas } = v.data;

    // Escritura vía SQL raw (mismo patrón conservador que los campos nuevos de Jugador)
    const inserted = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO "Charla" ("jugadorId", fecha, etiqueta, temas)
      VALUES (${jid}, ${fecha}, ${etiqueta ?? null}, ${JSON.stringify(temas)})
      RETURNING id
    `;
    const charla = await getCharlaById(inserted[0].id);
    console.log("[POST /api/charlas] creada id=" + inserted[0].id + " jugador=" + jid);
    return NextResponse.json(charla, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/charlas] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
