import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PDFButton from "@/components/PDFButton";

function pctColor(pct: number) {
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

function pctColorPrint(pct: number) {
  if (pct >= 85) return "#16a34a";
  if (pct >= 70) return "#d97706";
  return "#dc2626";
}

export default async function ReportesAsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const hoy = new Date();

  let year  = hoy.getFullYear();
  let month = hoy.getMonth();
  if (params.mes) {
    const [y, m] = params.mes.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      year  = y;
      month = m - 1;
    }
  }

  const inicioMes   = new Date(year, month, 1);
  const finMes      = new Date(year, month + 1, 0, 23, 59, 59);
  const esMesActual = year === hoy.getFullYear() && month === hoy.getMonth();

  const mesLabel = inicioMes
    .toLocaleDateString("es-UY", { month: "long", year: "numeric" })
    .toUpperCase();

  const anteriorYear  = month === 0  ? year - 1 : year;
  const siguienteYear = month === 11 ? year + 1 : year;

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

  const idsSemana = new Set(entrenosSemana.map((e) => e.id));

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
              mes.length) * 100
          )
        : null;

    const semana = j.asistencias.filter((a) => idsSemana.has(a.entrenamiento.id));
    const pctSemana =
      semana.length > 0
        ? Math.round(
            (semana.filter((a) => a.estado === "presente" || a.estado === "tardanza").length /
              semana.length) * 100
          )
        : null;

    const total    = j.asistencias.length;
    const pctAnual =
      total > 0
        ? Math.round(
            (j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length /
              total) * 100
          )
        : null;

    return { j, pctMes, pctSemana, pctAnual };
  });

  // Ranking: todos los jugadores con 100% anual
  const rankingAnual = datos.filter((d) => d.pctAnual === 100);

  const btnBase: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7,
    border: "1px solid var(--border)", textDecoration: "none",
    background: "var(--bg-card)", color: "#f1f5f9",
  };
  const btnDisabled: React.CSSProperties = {
    ...btnBase, opacity: 0.3, pointerEvents: "none", cursor: "default",
  };

  return (
    <>
      {/* ── Print styles ─────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1.5cm; }
          .no-print { display: none !important; }
          header, nav, aside { display: none !important; }
          main > *:not(.print-report) { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          .print-report { display: block !important; }
        }
      `}</style>

      {/* ── Print-only layout ─────────────────────────────────────────────── */}
      <div className="print-report" style={{ display: "none", fontFamily: "Arial, sans-serif", color: "#111" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>
            Club San Luis de Pando · Cat. 2017 Mixto
          </p>
          <p style={{ fontSize: 20, fontWeight: 900, margin: "4px 0 2px" }}>Reporte de Asistencia</p>
          <p style={{ fontSize: 13, color: "#444" }}>{mesLabel}</p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #111" }}>
              {["Jugador", "Semana", "Mes", "Anual"].map((h, i) => (
                <th key={h} style={{
                  padding: "6px 8px", textAlign: i === 0 ? "left" : "center",
                  fontWeight: 800, fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map(({ j, pctMes, pctSemana, pctAnual }, i) => (
              <tr key={j.id} style={{ borderBottom: "1px solid #ddd", background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                <td style={{ padding: "5px 8px", fontWeight: 600 }}>{j.nombre} {j.apellido}</td>
                <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700,
                  color: pctSemana !== null ? pctColorPrint(pctSemana) : "#999" }}>
                  {pctSemana !== null ? `${pctSemana}%` : "—"}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700,
                  color: pctMes !== null ? pctColorPrint(pctMes) : "#999" }}>
                  {pctMes !== null ? `${pctMes}%` : "—"}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700,
                  color: pctAnual !== null ? pctColorPrint(pctAnual) : "#999" }}>
                  {pctAnual !== null ? `${pctAnual}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 9, color: "#888", marginTop: 16, textAlign: "right" }}>
          Generado el {hoy.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── App UI ────────────────────────────────────────────────────────── */}
      <div className="no-print space-y-5 max-w-2xl">

        {/* Barra superior: Volver + Descargar PDF */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
          }}>
            ← Volver
          </Link>
          <PDFButton />
        </div>

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
            <div style={{
              display: "grid", gridTemplateColumns: esMesActual ? "1fr 60px 80px 80px 80px 1fr" : "1fr 60px 80px 80px 1fr",
              padding: "10px 16px", borderBottom: "1px solid var(--border)",
              background: "rgba(255,255,255,0.03)",
            }}>
              {(esMesActual ? ["Jugador", "Estado", "Semana", "Mes sel.", "Anual", "Barra"] : ["Jugador", "Estado", "Mes sel.", "Anual", "Barra"]).map((h, i) => (
                <span key={h} style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-muted)",
                  textAlign: i === 0 ? "left" : "center",
                }}>
                  {h}
                </span>
              ))}
            </div>

            {datos.map(({ j, pctMes, pctSemana, pctAnual }, i) => {
              const color       = pctMes    !== null ? pctColor(pctMes)    : "var(--text-muted)";
              const colorSemana = pctSemana !== null ? pctColor(pctSemana) : "var(--text-muted)";
              return (
                <div key={j.id} style={{
                  display: "grid", gridTemplateColumns: esMesActual ? "1fr 60px 80px 80px 80px 1fr" : "1fr 60px 80px 80px 1fr",
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
                    {pctSemana !== null
                      ? <span style={{ fontSize: 13, fontWeight: 800, color: colorSemana }}>{pctSemana}%</span>
                      : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                    }
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

        {/* Ranking: 100% anual */}
        <div>
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
          }}>
            100% Asistencia Anual
          </p>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, overflow: "hidden",
          }}>
            {rankingAnual.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ningún jugador con 100% anual aún</p>
              </div>
            ) : (
              rankingAnual.map(({ j }, i) => (
                <div key={j.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: i < rankingAnual.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                    {j.nombre} {j.apellido}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#10B981" }}>100%</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
}
