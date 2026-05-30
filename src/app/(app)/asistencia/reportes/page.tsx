import { prisma } from "@/lib/prisma";
import Link from "next/link";

function pctColor(pct: number) {
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

export default async function ReportesAsistenciaPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  const jugadores = await prisma.jugador.findMany({
    orderBy: [{ fichado: "desc" }, { numero_camiseta: "asc" }],
    include: { asistencias: { include: { entrenamiento: true } } },
  });

  const mesLabel = hoy.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  const datos = jugadores.map((j) => {
    const mes = j.asistencias.filter(
      (a) => new Date(a.entrenamiento.fecha) >= inicioMes && new Date(a.entrenamiento.fecha) <= finMes
    );
    const pctMes = mes.length > 0
      ? Math.round(mes.filter((a) => a.estado === "presente" || a.estado === "tardanza").length / mes.length * 100)
      : null;
    const total    = j.asistencias.length;
    const pctAnual = total > 0
      ? Math.round(j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length / total * 100)
      : null;
    return { j, pctMes, pctAnual };
  });

  const ranking = [...datos].filter((d) => d.pctMes !== null).sort((a, b) => (b.pctMes ?? 0) - (a.pctMes ?? 0));

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Month table */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
        }}>
          Asistencia — {mesLabel}
        </p>
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
            {["Jugador", "Estado", "Este mes", "Anual", "Barra mes"].map((h, i) => (
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
              <div
                key={j.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 60px 80px 80px 1fr",
                  alignItems: "center", gap: 4,
                  padding: "10px 16px",
                  borderBottom: i < datos.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
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
          {ranking.slice(0, 5).map(({ j, pctMes }, i) => {
            const color = pctMes !== null ? pctColor(pctMes) : "var(--text-muted)";
            return (
              <div key={j.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
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
          })}
        </div>
      </div>
    </div>
  );
}
