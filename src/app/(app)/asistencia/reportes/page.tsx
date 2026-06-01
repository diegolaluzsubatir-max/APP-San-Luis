import { prisma } from "@/lib/prisma";
import Link from "next/link";

function pctColor(pct: number) {
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}


export default async function ReportesAsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const hoy = new Date();

  // Parse selected month from ?mes=YYYY-MM, default to current month
  let year  = hoy.getFullYear();
  let month = hoy.getMonth(); // 0-indexed
  if (params.mes) {
    const [y, m] = params.mes.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      year  = y;
      month = m - 1;
    }
  }

  const inicioMes = new Date(year, month, 1);
  const finMes    = new Date(year, month + 1, 0, 23, 59, 59);
  const esMesActual = year === hoy.getFullYear() && month === hoy.getMonth();

  const mesLabel = inicioMes
    .toLocaleDateString("es-UY", { month: "long", year: "numeric" })
    .toUpperCase();

  const anteriorYear  = month === 0  ? year - 1 : year;
  const siguienteYear = month === 11 ? year + 1 : year;

  // Semana en curso (siempre basada en hoy, no en el mes seleccionado)
  const diaSemana    = hoy.getDay();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  inicioSemana.setHours(0, 0, 0, 0);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);

  const [jugadores, entrenosSemana] = await Promise.all([
    prisma.jugador.findMany({
      orderBy: [{ fichado: "desc" }, { numero_camiseta: "asc" }],
      include: { asistencias: { include: { entrenamiento: true } } },
    }),
    prisma.entrenamiento.findMany({
      where: { fecha: { gte: inicioSemana, lte: finSemana }, suspendido: false },
      orderBy: { fecha: "asc" },
      include: { asistencias: true },
    }),
  ]);

  const datos = jugadores.map((j) => {
    const mes = j.asistencias.filter(
      (a) =>
        new Date(a.entrenamiento.fecha) >= inicioMes &&
        new Date(a.entrenamiento.fecha) <= finMes
    );
    const pctMes =
      mes.length > 0
        ? Math.round(
            (mes.filter((a) => a.estado === "presente" || a.estado === "tardanza").length /
              mes.length) *
              100
          )
        : null;
    const total    = j.asistencias.length;
    const pctAnual =
      total > 0
        ? Math.round(
            (j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza")
              .length /
              total) *
              100
          )
        : null;
    return { j, pctMes, pctAnual };
  });

  const ranking = [...datos]
    .filter((d) => d.pctMes !== null)
    .sort((a, b) => (b.pctMes ?? 0) - (a.pctMes ?? 0));

  const btnBase: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7,
    border: "1px solid var(--border)", textDecoration: "none",
    background: "var(--bg-card)", color: "#f1f5f9",
  };
  const btnDisabled: React.CSSProperties = {
    ...btnBase, opacity: 0.3, pointerEvents: "none", cursor: "default",
  };

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ESTA SEMANA */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
        }}>
          Esta semana
        </p>
        {entrenosSemana.length === 0 ? (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 16px", textAlign: "center",
          }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin actividad esta semana</p>
          </div>
        ) : (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
          }}>
            {entrenosSemana.map((e, i) => {
              const total     = e.asistencias.length;
              const presentes = e.asistencias.filter(
                (a) => a.estado === "presente" || a.estado === "tardanza"
              ).length;
              const pct   = total > 0 ? Math.round((presentes / total) * 100) : null;
              const color = pct !== null ? pctColor(pct) : "var(--text-muted)";
              const diaLabel = new Date(e.fecha)
                .toLocaleDateString("es-UY", {
                  weekday: "short", day: "numeric", month: "short",
                  timeZone: "America/Montevideo",
                })
                .toUpperCase();
              const esOpcional = e.tipo === "opcional";
              return (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: i < entrenosSemana.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{diaLabel}</p>
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      marginTop: 3, display: "inline-block",
                      background: esOpcional ? "rgba(245,158,11,0.1)" : "rgba(14,165,233,0.1)",
                      color: esOpcional ? "#F59E0B" : "#0EA5E9",
                      border: `1px solid ${esOpcional ? "rgba(245,158,11,0.25)" : "rgba(14,165,233,0.2)"}`,
                    }}>
                      {e.tipo}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {pct !== null ? (
                      <>
                        <p style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                          {presentes}/{total}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Sin datos</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabla del mes con navegación */}
      <div>
        {/* Título + navegación */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-muted)",
          }}>
            {mesLabel}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <Link
              href={`/asistencia/reportes?mes=${anteriorYear}-${String(month === 0 ? 12 : month).padStart(2, "0")}`}
              style={btnBase}
            >
              ‹ Anterior
            </Link>
            {esMesActual ? (
              <span style={btnDisabled}>Siguiente ›</span>
            ) : (
              <Link
                href={`/asistencia/reportes?mes=${siguienteYear}-${String(month === 11 ? 1 : month + 2).padStart(2, "0")}`}
                style={btnBase}
              >
                Siguiente ›
              </Link>
            )}
          </div>
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 60px 80px 80px 1fr",
            padding: "10px 16px", borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
          }}>
            {["Jugador", "Estado", "Mes sel.", "Anual", "Barra"].map((h, i) => (
              <span key={h} style={{
                fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--text-muted)",
                textAlign: i === 0 ? "left" : "center",
              }}>
                {h}
              </span>
            ))}
          </div>

          {datos.map(({ j, pctMes, pctAnual }, i) => {
            const color = pctMes !== null ? pctColor(pctMes) : "var(--text-muted)";
            return (
              <div key={j.id} style={{
                display: "grid", gridTemplateColumns: "1fr 60px 80px 80px 1fr",
                alignItems: "center", gap: 4, padding: "10px 16px",
                borderBottom: i < datos.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div>
                  <Link href={`/jugadores/${j.id}`} style={{
                    fontSize: 13, fontWeight: 700, color: "#f1f5f9", textDecoration: "none",
                  }}>
                    {j.nombre} {j.apellido}
                  </Link>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: 8, padding: "2px 5px", borderRadius: 4, fontWeight: 700,
                    background: j.fichado ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.06)",
                    color: j.fichado ? "#0EA5E9" : "rgba(241,245,249,0.35)",
                    border: `1px solid ${j.fichado ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                    {j.fichado ? "FCH" : "ENT"}
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  {pctMes !== null
                    ? <span style={{ fontSize: 13, fontWeight: 800, color }}>{pctMes}%</span>
                    : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  }
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {pctAnual !== null ? `${pctAnual}%` : "—"}
                  </span>
                </div>
                <div style={{ paddingRight: 8 }}>
                  {pctMes !== null && (
                    <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pctMes}%`, background: color, borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranking */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
        }}>
          Ranking del mes
        </p>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {ranking.length === 0 ? (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos para este mes</p>
            </div>
          ) : (
            ranking.slice(0, 5).map(({ j, pctMes }, i) => {
              const color = pctMes !== null ? pctColor(pctMes) : "var(--text-muted)";
              return (
                <div key={j.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: i < Math.min(ranking.length, 5) - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ width: 28, textAlign: "center", fontSize: 18 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}°`}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                    {j.nombre} {j.apellido}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 900, color }}>{pctMes}%</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
