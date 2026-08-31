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

  // Fecha en dd/mm/aaaa usando getters UTC (las fechas se guardan a medianoche
  // UTC; los getters locales podían correr el día).
  const fmtFecha = (d: Date | null): string | null =>
    d
      ? `${String(d.getUTCDate()).padStart(2, "0")}/${String(
          d.getUTCMonth() + 1
        ).padStart(2, "0")}/${d.getUTCFullYear()}`
      : null;

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
      // Campos extra para exportación a Excel
      cedula:           j.cedula,
      padre_nombre:     j.padre_nombre,
      padre_telefono:   j.padre_telefono,
      madre_nombre:     j.madre_nombre,
      madre_telefono:   j.madre_telefono,
      fecha_nacimiento: fmtFecha(j.fecha_nacimiento),
      ci_vencimiento:   fmtFecha(j.ci_vencimiento),
    };
  });

  return <JugadoresClient jugadores={jugadores} />;
}
