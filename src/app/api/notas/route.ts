import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notas = await prisma.nota.findMany({
    orderBy: { creado_en: "desc" },
  });
  return NextResponse.json(notas);
}

export async function POST(req: NextRequest) {
  const { titulo, contenido, prioridad } = await req.json();
  if (!titulo?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const nota = await prisma.nota.create({
    data: {
      titulo:    titulo.trim(),
      contenido: contenido?.trim() ?? "",
      prioridad: prioridad ?? "normal",
      estado:    "pendiente",
    },
  });
  return NextResponse.json(nota, { status: 201 });
}
