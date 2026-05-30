import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const nid = parseInt(id);
  if (isNaN(nid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { titulo, contenido, estado, prioridad } = body as Record<string, string>;

  const nota = await prisma.nota.update({
    where: { id: nid },
    data: {
      ...(titulo     !== undefined && { titulo:     titulo.trim()    }),
      ...(contenido  !== undefined && { contenido:  contenido.trim() }),
      ...(estado     !== undefined && { estado }),
      ...(prioridad  !== undefined && { prioridad }),
    },
  });
  return NextResponse.json(nota);
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const nid = parseInt(id);
  if (isNaN(nid)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  await prisma.nota.delete({ where: { id: nid } });
  return NextResponse.json({ ok: true });
}
