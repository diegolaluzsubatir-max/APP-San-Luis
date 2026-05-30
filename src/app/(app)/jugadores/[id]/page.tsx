import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import JugadorDetailClient, { JugadorEditable, Stats } from "./JugadorDetailClient";

interface Props { params: Promise<{ id: string }> }

export default async function JugadorPage({ params }: Props) {
  const { id } = await params;
  const jugadorId = parseInt(id);
  if (isNaN(jugadorId)) notFound();

  const j = await prisma.jugador.findUnique({
    where: { id: jugadorId },
    include: {
      participaciones: { include: { partido: true } },
      asistencias: {
        include: { entrenamiento: true },
        orderBy: { entrenamiento: { fecha: "desc" } },
      },
      evaluaciones: { orderBy: { fecha: "asc" } },
    },
  });
  if (!j) notFound();

  // ── Compute stats ──────────────────────────────────────────────────────────
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  const asistenMes = j.asistencias.filter(
    a => new Date(a.entrenamiento.fecha) >= inicioMes && new Date(a.entrenamiento.fecha) <= finMes
  );
  const pctMes = asistenMes.length > 0
    ? Math.round(asistenMes.filter(a => a.estado === "presente" || a.estado === "tardanza").length / asistenMes.length * 100)
    : null;
  const pctAnual = j.asistencias.length > 0
    ? Math.round(j.asistencias.filter(a => a.estado === "presente" || a.estado === "tardanza").length / j.asistencias.length * 100)
    : null;

  const meses: Record<string, { total: number; presentes: number }> = {};
  for (const a of j.asistencias) {
    const m = new Date(a.entrenamiento.fecha).toLocaleDateString("es-UY", { month: "short", year: "2-digit", timeZone: "America/Montevideo" });
    if (!meses[m]) meses[m] = { total: 0, presentes: 0 };
    meses[m].total++;
    if (a.estado === "presente" || a.estado === "tardanza") meses[m].presentes++;
  }

  const ultimaEval = j.evaluaciones.at(-1) ?? null;

  const stats: Stats = {
    partidos:      j.participaciones.length,
    goles:         j.participaciones.reduce((s, p) => s + p.goles, 0),
    asistencias:   j.participaciones.reduce((s, p) => s + p.asistencias_stat, 0),
    minutos:       j.participaciones.reduce((s, p) => s + p.minutos, 0),
    pctMes,
    pctAnual,
    meses,
    ultimaEval:      ultimaEval ? JSON.parse(JSON.stringify(ultimaEval)) : null,
    ultimaEvalFecha: ultimaEval?.fecha?.toISOString() ?? null,
  };

  // ── Serialize jugador (strip relations) ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { participaciones, asistencias, evaluaciones, ...raw } = j as typeof j & {
    direccion?: string | null
    tutor_nombre?: string | null
    tutor_telefono?: string | null
    tutor_relacion?: string | null
    obs_generales?: string | null
    foto_url?: string | null
  };
  const jugador: JugadorEditable = JSON.parse(JSON.stringify(raw));

  return <JugadorDetailClient jugador={jugador} stats={stats} />;
}
