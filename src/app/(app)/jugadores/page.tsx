export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import JugadoresClient, { JugadorListItem } from "./JugadoresClient";

export default async function JugadoresPage() {
  // Trae todo el plantel en una sola query, con TODAS las asistencias
  // (sin filtro de fecha) para poder calcular el % anual en memoria.
  const raw = await prisma.jugador.findMany({
    include: {
      asistencias: true,
      participaciones: true,
    },
    orderBy: [
      { numero_camiseta: "asc" },
      { apellido: "asc" },
    ],
  });

  // foto_url y posiciones_sec se leen por raw (mismo patrón que ya se usaba
  // para la foto), en una sola consulta para todo el plantel.
  const extraRaw = await prisma.$queryRaw<
    { id: number; foto_url: string | null; posiciones_sec: string | null }[]
  >`
    SELECT id, foto_url, posiciones_sec FROM "Jugador"
  `;
  const extraMap = new Map(extraRaw.map((f) => [f.id, f]));

  const jugadores: JugadorListItem[] = raw.map((j) => {
    // % anual — misma fórmula que Reportes (columna Anual):
    // presentes+tardanzas sobre el total de asistencias registradas.
    const total    = j.asistencias.length;
    const presentes = j.asistencias.filter(
      (a) => a.estado === "presente" || a.estado === "tardanza"
    ).length;
    const pctAnual = total > 0 ? Math.round((presentes / total) * 100) : null;

    const extra = extraMap.get(j.id);
    return {
      id:               j.id,
      nombre:           j.nombre,
      apellido:         j.apellido,
      numero_camiseta:  j.numero_camiseta,
      posicion:         j.posicion,
      posiciones_sec:   extra?.posiciones_sec ?? null,
      fichado:          j.fichado,
      estado:           j.estado,
      foto_url:         extra?.foto_url ?? null,
      pctAnual,
      goles:            j.participaciones.reduce((s, p) => s + p.goles, 0),
      asistencias_stat: j.participaciones.reduce((s, p) => s + p.asistencias_stat, 0),
    };
  });

  return <JugadoresClient jugadores={jugadores} />;
}
