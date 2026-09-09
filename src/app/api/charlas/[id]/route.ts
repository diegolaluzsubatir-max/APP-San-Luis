import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarCharla, getCharlaById } from "@/lib/charlas";

interface Context { params: Promise<{ id: string }> }

// PUT /api/charlas/[id]  { fecha?, etiqueta?, temas? }
export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const v = validarCharla(body, true);
    if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
    const { fecha, etiqueta, temas } = v.data;

    const actual = await getCharlaById(cid);
    if (!actual) return NextResponse.json({ error: "Charla no encontrada" }, { status: 404 });

    await prisma.$executeRaw`
      UPDATE "Charla"
      SET fecha    = ${fecha ?? new Date(actual.fecha)},
          etiqueta = ${etiqueta !== undefined ? etiqueta : actual.etiqueta},
          temas    = ${JSON.stringify(temas ?? actual.temas)}
      WHERE id = ${cid}
    `;
    const charla = await getCharlaById(cid);
    console.log("[PUT /api/charlas/" + cid + "] guardado OK");
    return NextResponse.json(charla);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/charlas/" + cid + "] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/charlas/[id]
export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const cid = parseInt(id);
  if (isNaN(cid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const n = await prisma.$executeRaw`DELETE FROM "Charla" WHERE id = ${cid}`;
    if (n === 0) return NextResponse.json({ error: "Charla no encontrada" }, { status: 404 });
    console.log("[DELETE /api/charlas/" + cid + "] OK");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/charlas/" + cid + "] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
