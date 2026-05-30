export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PlanificacionClient from "./PlanificacionClient";

interface Props { params: Promise<{ id: string }> }

export default async function PlanificacionPage({ params }: Props) {
  const { id } = await params;
  const partidoId = parseInt(id);
  if (isNaN(partidoId)) notFound();

  const [partido, jugadoresFichados] = await Promise.all([
    prisma.partido.findUnique({
      where: { id: partidoId },
      include: { planificacion: { include: { jugador: true } } },
    }),
    prisma.jugador.findMany({
      where: { fichado: true, estado: "activo" },
      orderBy: [{ numero_camiseta: "asc" }, { apellido: "asc" }],
    }),
  ]);

  if (!partido) notFound();

  return (
    <PlanificacionClient
      partido={JSON.parse(JSON.stringify(partido))}
      jugadoresFichados={JSON.parse(JSON.stringify(jugadoresFichados))}
    />
  );
}
