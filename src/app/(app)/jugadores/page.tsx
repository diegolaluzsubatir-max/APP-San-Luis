import { prisma } from "@/lib/prisma";
import JugadoresClient, { JugadorListItem } from "./JugadoresClient";

export default async function JugadoresPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  const raw = await prisma.jugador.findMany({
    include: {
      asistencias: {
        where: { entrenamiento: { fecha: { gte: inicioMes, lte: finMes } } },
      },
      participaciones: true,
    },
    orderBy: [
      { numero_camiseta: "asc" },
      { apellido: "asc" },
    ],
  });

  const fotosRaw = await prisma.$queryRaw<{ id: number; foto_url: string | null }[]>`
    SELECT id, foto_url FROM "Jugador"
  `;
  const fotosMap = new Map(fotosRaw.map((f) => [f.id, f.foto_url]));

  const jugadores: JugadorListItem[] = raw.map((j) => {
    const total   = j.asistencias.length;
    const present = j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
    const pct     = total > 0 ? Math.round((present / total) * 100) : null;
    return {
      id:               j.id,
      nombre:           j.nombre,
      apellido:         j.apellido,
      numero_camiseta:  j.numero_camiseta,
      posicion:         j.posicion,
      fichado:          j.fichado,
      estado:           j.estado,
      foto_url:         fotosMap.get(j.id) ?? null,
      pct,
      goles:            j.participaciones.reduce((s, p) => s + p.goles, 0),
      asistencias_stat: j.participaciones.reduce((s, p) => s + p.asistencias_stat, 0),
    };
  });

  return <JugadoresClient jugadores={jugadores} />;
}
