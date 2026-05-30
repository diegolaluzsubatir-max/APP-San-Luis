import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EntrenamientoDetailClient from "./EntrenamientoDetailClient";

interface Props { params: Promise<{ id: string }> }

export default async function EntrenamientoDetailPage({ params }: Props) {
  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) notFound();

  const entrenamiento = await prisma.entrenamiento.findUnique({
    where: { id: eid },
    include: { asistencias: true },
  });
  if (!entrenamiento) notFound();

  return (
    <EntrenamientoDetailClient
      entrenamiento={JSON.parse(JSON.stringify(entrenamiento))}
    />
  );
}
