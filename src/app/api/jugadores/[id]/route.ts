import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jid = parseInt(id);
  if (isNaN(jid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  console.log("[PUT /api/jugadores/" + jid + "] body recibido:", JSON.stringify(data).substring(0, 200));

  try {
    // Campos originales del schema — funcionan aunque el cliente Prisma no se haya regenerado
    await prisma.jugador.update({
      where: { id: jid },
      data: {
        nombre:             String(data.nombre ?? ""),
        apellido:           String(data.apellido ?? ""),
        numero_camiseta:    data.numero_camiseta != null ? Number(data.numero_camiseta) : null,
        posicion:           (data.posicion as string) || null,
        pierna_habil:       (data.pierna_habil as string) || null,
        estado:             (data.estado as string) || "activo",
        fichado:            Boolean(data.fichado),
        cedula:             (data.cedula as string) || null,
        fecha_nacimiento:   data.fecha_nacimiento ? new Date(data.fecha_nacimiento as string) : null,
        madre_nombre:       (data.madre_nombre as string) || null,
        madre_telefono:     (data.madre_telefono as string) || null,
        padre_nombre:       (data.padre_nombre as string) || null,
        padre_telefono:     (data.padre_telefono as string) || null,
        contacto_email:     (data.contacto_email as string) || null,
        mutualista:         (data.mutualista as string) || null,
        alergias:           (data.alergias as string) || null,
        medicacion:         (data.medicacion as string) || null,
        obs_medicas:        (data.obs_medicas as string) || null,
        ci_vencimiento:     data.ci_vencimiento ? new Date(data.ci_vencimiento as string) : null,
        ficha_medica_vence: data.ficha_medica_vence ? new Date(data.ficha_medica_vence as string) : null,
        autorizacion:       Boolean(data.autorizacion),
      },
    });

    // Campos nuevos (agregados con db push) — vía SQL raw para evitar incompatibilidad del cliente Prisma
    const dir   = (data.direccion as string) || null;
    const tNom  = (data.tutor_nombre as string) || null;
    const tTel  = (data.tutor_telefono as string) || null;
    const tRel  = (data.tutor_relacion as string) || null;
    const obsG  = (data.obs_generales as string) || null;
    const foto  = (data.foto_url as string) || null;

    await prisma.$executeRaw`
      UPDATE "Jugador"
      SET direccion      = ${dir},
          tutor_nombre   = ${tNom},
          tutor_telefono = ${tTel},
          tutor_relacion = ${tRel},
          obs_generales  = ${obsG},
          foto_url       = ${foto}
      WHERE id = ${jid}
    `;

    // Devolver el registro completo actualizado
    const result = await prisma.$queryRaw<unknown[]>`SELECT * FROM "Jugador" WHERE id = ${jid}`;
    const row = (result as Record<string, unknown>[])[0];

    console.log("[PUT /api/jugadores/" + jid + "] guardado OK");
    return NextResponse.json(JSON.parse(JSON.stringify(row)));

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/jugadores/" + jid + "] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
