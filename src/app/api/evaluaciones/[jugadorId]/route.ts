import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jugadorId: string }> }
) {
  const { jugadorId } = await params;
  const jid = parseInt(jugadorId);
  if (isNaN(jid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const eval_ = await prisma.evaluacion.create({
    data: {
      jugadorId: jid,
      fecha:     new Date(),
      conducta:            body.conducta,
      compromiso:          body.compromiso,
      respeto:             body.respeto,
      companerismo:        body.companerismo,
      control_balon:       body.control_balon,
      pase:                body.pase,
      recepcion:           body.recepcion,
      definicion:          body.definicion,
      comprension_tactica: body.comprension_tactica,
      velocidad:           body.velocidad,
      coordinacion:        body.coordinacion,
      observaciones:       body.observaciones || null,
    },
  });

  return NextResponse.json({ id: eval_.id });
}
