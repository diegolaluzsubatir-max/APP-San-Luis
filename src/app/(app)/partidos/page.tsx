export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtFecha, resultadoPartido } from "@/lib/utils";

export default async function PartidosPage() {
  const partidos = await prisma.partido.findMany({
    orderBy: { fecha: "desc" },
  });

  const pendientes = partidos.filter((p) => p.estado === "pendiente");
  const jugados    = partidos.filter((p) => p.estado === "jugado" || p.estado === "finalizado");

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex justify-end">
        <Link
          href="/partidos/nuevo"
          style={{
            padding: "8px 18px",
            background: "linear-gradient(135deg, #0EA5E9, #0284c7)",
            color: "#fff",
            fontSize: 12, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
            borderRadius: 9, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
          }}
        >
          + Nuevo partido
        </Link>
      </div>

      {pendientes.length > 0 && (
        <PartidosList title="Próximos partidos" partidos={pendientes} />
      )}

      {jugados.length > 0 && (
        <PartidosList title="Partidos jugados" partidos={jugados} />
      )}

      {partidos.length === 0 && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "32px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin partidos registrados</p>
        </div>
      )}
    </div>
  );
}

function PartidosList({ title, partidos }: {
  title: string;
  partidos: Array<{
    id: number; fecha: Date; rival: string; lugar: string | null;
    condicion: string; campeonato: string | null;
    goles_local: number | null; goles_visita: number | null; estado: string;
  }>;
}) {
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
      }}>
        {title}
      </p>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {partidos.map((p, i) => {
          const r = (p.estado === "jugado" || p.estado === "finalizado") ? resultadoPartido(p) : null;
          const esPendiente = p.estado === "pendiente";

          const resultConfig = r === "V"
            ? { bg: "rgba(16,185,129,0.12)", color: "#10B981", border: "rgba(16,185,129,0.3)", label: "V" }
            : r === "E"
            ? { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.3)", label: "E" }
            : r === "D"
            ? { bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "rgba(239,68,68,0.3)", label: "D" }
            : { bg: "rgba(14,165,233,0.08)", color: "#0EA5E9", border: "rgba(14,165,233,0.2)", label: "⚽" };

          const sanLuisGoles = p.condicion === "local" ? p.goles_local : p.goles_visita;
          const rivalGoles   = p.condicion === "local" ? p.goles_visita : p.goles_local;

          return (
            <Link
              key={p.id}
              href={`/partidos/${p.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                borderBottom: i < partidos.length - 1 ? "1px solid var(--border)" : "none",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-[rgba(255,255,255,0.03)]"
            >
              {/* Result / status badge */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: resultConfig.bg,
                border: `1px solid ${resultConfig.border}`,
                color: resultConfig.color,
                fontWeight: 900, fontSize: r ? 16 : 18,
              }}>
                {resultConfig.label}
              </div>

              {/* Match info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Teams */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>San Luis</span>
                  {!esPendiente && sanLuisGoles !== null && rivalGoles !== null && (
                    <span style={{
                      fontSize: 14, fontWeight: 900, color: resultConfig.color,
                      padding: "1px 6px", borderRadius: 5,
                      background: resultConfig.bg,
                    }}>
                      {sanLuisGoles} – {rivalGoles}
                    </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                    {esPendiente ? "vs" : ""} {p.rival}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {fmtFecha(p.fecha)}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {p.condicion === "local" ? "🏠 Local" : "✈️ Visitante"}
                  </span>
                  {p.lugar && (
                    <>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                        📍 {p.lugar}
                      </span>
                    </>
                  )}
                </div>

                {/* Estado badge */}
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    fontSize: 9, padding: "2px 7px", borderRadius: 4,
                    fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                    background: esPendiente ? "rgba(14,165,233,0.10)" : resultConfig.bg,
                    color: esPendiente ? "#0EA5E9" : resultConfig.color,
                    border: `1px solid ${esPendiente ? "rgba(14,165,233,0.25)" : resultConfig.border}`,
                  }}>
                    {esPendiente ? "Próximo" : "Finalizado"}
                  </span>
                  {p.campeonato && (
                    <span style={{
                      marginLeft: 6, fontSize: 9, padding: "2px 7px", borderRadius: 4,
                      fontWeight: 700, color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                    }}>
                      {p.campeonato}
                    </span>
                  )}
                </div>
              </div>

              <span style={{ color: "var(--border-bright)", fontSize: 16, flexShrink: 0 }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
