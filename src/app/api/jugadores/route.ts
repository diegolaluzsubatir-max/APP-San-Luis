import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Únicos campos obligatorios: nombre y apellido. El resto puede quedar vacío.
  const nombre   = String(data.nombre ?? "").trim();
  const apellido = String(data.apellido ?? "").trim();
  if (!nombre || !apellido) {
    return NextResponse.json({ error: "Nombre y apellido son obligatorios" }, { status: 400 });
  }

  console.log("[POST /api/jugadores] body recibido:", JSON.stringify(data).substring(0, 200));

  try {
    // Campos originales del schema — funcionan con el cliente Prisma actual
    const creado = await prisma.jugador.create({
      data: {
        nombre,
        apellido,
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

    const jid = creado.id;

    // Campos nuevos (agregados con db push) — vía SQL raw para evitar incompatibilidad del cliente Prisma.
    // La foto no se carga en el alta (v1): se agrega después desde "Editar".
    const dir  = (data.direccion as string) || null;
    const tNom = (data.tutor_nombre as string) || null;
    const tTel = (data.tutor_telefono as string) || null;
    const tRel = (data.tutor_relacion as string) || null;
    const obsG = (data.obs_generales as string) || null;
    const posSec = (data.posiciones_sec as string) || null;

    await prisma.$executeRaw`
      UPDATE "Jugador"
      SET direccion      = ${dir},
          tutor_nombre   = ${tNom},
          tutor_telefono = ${tTel},
          tutor_relacion = ${tRel},
          obs_generales  = ${obsG},
          posiciones_sec = ${posSec}
      WHERE id = ${jid}
    `;

    // Devolver el registro completo creado
    const result = await prisma.$queryRaw<unknown[]>`SELECT * FROM "Jugador" WHERE id = ${jid}`;
    const row = (result as Record<string, unknown>[])[0];

    console.log("[POST /api/jugadores] creado OK, id=" + jid);
    return NextResponse.json(JSON.parse(JSON.stringify(row)), { status: 201 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/jugadores] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
