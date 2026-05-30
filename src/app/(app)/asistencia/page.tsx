import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtFecha } from "@/lib/utils";

export default async function AsistenciaPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const entrenamientos = await prisma.entrenamiento.findMany({
    where: { fecha: { gte: inicioMes } },
    orderBy: { fecha: "desc" },
    include: { asistencias: true },
  });

  const pasados = await prisma.entrenamiento.findMany({
    where: { fecha: { lt: inicioMes } },
    orderBy: { fecha: "desc" },
    take: 5,
    include: { asistencias: true },
  });

  return (
    <div style={{ maxWidth: 640 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Link
          href="/asistencia/reportes"
          style={{ fontSize: 12, color: "var(--blue-elec)", fontWeight: 700, textDecoration: "none" }}
        >
          Ver reportes →
        </Link>
      </div>

      <EntrenaList title="Este mes" entrenamientos={entrenamientos} />
      {pasados.length > 0 && <EntrenaList title="Anteriores" entrenamientos={pasados} />}
    </div>
  );
}

function pctColor(pct: number) {
  if (pct >= 85) return "var(--green-neon)";
  if (pct >= 70) return "var(--yellow-neon)";
  return "var(--red-neon)";
}

function EntrenaList({ title, entrenamientos }: {
  title: string;
  entrenamientos: Array<{
    id: number; fecha: Date; hora_inicio: string; lugar: string;
    entrenador: string; estado: string; asistencias: Array<{ estado: string }>;
  }>;
}) {
  return (
    <div>
      <h2 style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
      }}>
        {title}
      </h2>
      <div className="glass-card overflow-hidden">
        {entrenamientos.length === 0 ? (
          <p style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>Sin entrenamientos</p>
        ) : (
          <div>
            {entrenamientos.map((e, i) => {
              const total   = e.asistencias.length;
              const present = e.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
              const pct     = total > 0 ? Math.round((present / total) * 100) : null;
              const color   = pct !== null ? pctColor(pct) : "var(--text-muted)";

              const estadoConfig =
                e.estado === "realizado"
                  ? { label: "✓", bg: "rgba(0,230,118,0.12)", color: "var(--green-neon)", border: "rgba(0,230,118,0.25)" }
                  : e.estado === "cancelado"
                  ? { label: "✕", bg: "rgba(255,68,68,0.12)", color: "var(--red-neon)", border: "rgba(255,68,68,0.25)" }
                  : { label: "Plan.", bg: "rgba(0,168,255,0.08)", color: "var(--blue-elec)", border: "rgba(0,168,255,0.2)" };

              return (
                <Link
                  key={e.id}
                  href={`/asistencia/${e.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: i < entrenamientos.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  className="hover:bg-[rgba(255,255,255,0.03)]"
                >
                  {/* Date block */}
                  <div style={{
                    width: 40,
                    textAlign: "center",
                    flexShrink: 0,
                  }}>
                    <p style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "var(--blue-elec)",
                      lineHeight: 1,
                      textShadow: "0 0 12px rgba(0,168,255,0.4)",
                    }}>
                      {new Date(e.fecha).getDate()}
                    </p>
                    <p style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginTop: 1,
                    }}>
                      {new Date(e.fecha).toLocaleDateString("es-UY", { month: "short", timeZone: "America/Montevideo" })}
                    </p>
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                      {e.hora_inicio} — {e.lugar}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{e.entrenador}</p>
                  </div>

                  {/* Attendance */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {pct !== null ? (
                      <>
                        <p style={{
                          fontSize: 15, fontWeight: 900, color,
                          textShadow: `0 0 10px ${color}60`,
                          lineHeight: 1,
                        }}>
                          {pct}%
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                          {present}/{total}
                        </p>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sin registro</span>
                    )}
                  </div>

                  {/* Estado badge */}
                  <span style={{
                    fontSize: 10,
                    padding: "3px 7px",
                    borderRadius: 4,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    background: estadoConfig.bg,
                    color: estadoConfig.color,
                    border: `1px solid ${estadoConfig.border}`,
                    flexShrink: 0,
                  }}>
                    {estadoConfig.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
