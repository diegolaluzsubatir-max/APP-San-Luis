import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { fmtFechaLarga } from "@/lib/utils";
import AsistenciaClient from "./AsistenciaClient";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default async function AsistenciaDetallePage({ params }: Props) {
  const { id } = await params;
  const eid = parseInt(id);
  if (isNaN(eid)) notFound();

  const entrenamiento = await prisma.entrenamiento.findUnique({
    where: { id: eid },
    include: { asistencias: true },
  });
  if (!entrenamiento) notFound();

  // Todos los jugadores (fichados Y no fichados): fichados primero, luego por número
  const jugadores = await prisma.jugador.findMany({
    orderBy: [{ fichado: "desc" }, { numero_camiseta: "asc" }, { apellido: "asc" }],
  });

  const registros = jugadores.map((j) => {
    const a = entrenamiento.asistencias.find((a) => a.jugadorId === j.id);
    return {
      jugadorId:     j.id,
      estado:        (a?.estado ?? "presente") as "presente" | "tardanza" | "ausente" | "justificado",
      observaciones: a?.observaciones ?? "",
    };
  });

  const totalJugadores = jugadores.length;
  const totalFichados  = jugadores.filter((j) => j.fichado).length;

  return (
    <div className="max-w-xl space-y-4">

      {/* Volver */}
      <Link href="/entrenamientos" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 14, fontWeight: 600, color: "#0EA5E9",
        textDecoration: "none",
      }}>
        ← Entrenamientos
      </Link>

      {/* Info card */}
      <div style={{
        background: "rgba(17,24,39,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid #1e2d4a", borderRadius: 14,
        padding: "14px 16px",
      }}>
        <div style={{ height: 2, background: "linear-gradient(90deg,#0EA5E9,#10B981)", borderRadius: 1, marginBottom: 12 }} />
        <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>
          {fmtFechaLarga(entrenamiento.fecha)}
        </p>
        <p style={{ fontSize: 12, color: "rgba(241,245,249,0.55)", marginTop: 4 }}>
          {entrenamiento.hora_inicio} – {entrenamiento.hora_fin} · {entrenamiento.lugar}
        </p>
        {entrenamiento.objetivo && (
          <p style={{ fontSize: 11, color: "rgba(241,245,249,0.4)", marginTop: 3 }}>
            {entrenamiento.objetivo}
          </p>
        )}
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.35)", marginTop: 6 }}>
          {totalFichados} fichados · {totalJugadores - totalFichados} entrenamiento
        </p>
      </div>

      <AsistenciaClient
        entrenamientoId={entrenamiento.id}
        jugadores={jugadores}
        registrosIniciales={registros}
        totalJugadores={totalJugadores}
      />
    </div>
  );
}
