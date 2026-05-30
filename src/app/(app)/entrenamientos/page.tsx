export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EntrenamientosPage() {
  const hoy  = new Date();
hoy.setHours(0, 0, 0, 0);
  const todos = await prisma.entrenamiento.findMany({
    orderBy: { fecha: "desc" },
    include: { asistencias: true },
  });

  const proximos = todos.filter((e) => new Date(e.fecha) >= hoy && !e.suspendido)
                        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const pasados  = todos.filter((e) => new Date(e.fecha) < hoy || e.suspendido);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex justify-end">
        <Link
          href="/entrenamientos/nuevo"
          style={{
            padding: "8px 18px",
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#fff",
            fontSize: 12, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
            borderRadius: 9, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
          }}
        >
          + Nuevo
        </Link>
      </div>

      {proximos.length > 0 && <EntrenoList title="Próximos" entrenamientos={proximos} hoy={hoy} />}
      {pasados.length  > 0 && <EntrenoList title="Historial" entrenamientos={pasados} hoy={hoy} />}
      {todos.length === 0 && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "32px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin entrenamientos registrados</p>
        </div>
      )}
    </div>
  );
}

function pctColor(pct: number) {
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

type EntrenoItem = {
  id: number; fecha: Date; hora_inicio: string; hora_fin: string;
  lugar: string; entrenador: string; objetivo: string | null;
  estado: string; suspendido: boolean; motivo_suspension: string | null;
  asistencias: { estado: string }[];
};

function badgeConf(e: EntrenoItem, hoy: Date) {
  if (e.suspendido)
    return { label: "SUSPENDIDA",  bg: "rgba(239,68,68,0.12)",    color: "#EF4444", border: "rgba(239,68,68,0.3)"    };
  if (e.estado === "realizado")
    return { label: "REALIZADO",   bg: "rgba(16,185,129,0.10)",   color: "#10B981", border: "rgba(16,185,129,0.25)" };
  if (new Date(e.fecha) >= hoy)
    return { label: "PLANIFICADO", bg: "rgba(14,165,233,0.08)",   color: "#0EA5E9", border: "rgba(14,165,233,0.2)"  };
  if (e.asistencias.length === 0)
    return { label: "PENDIENTE",   bg: "rgba(245,158,11,0.10)",   color: "#F59E0B", border: "rgba(245,158,11,0.25)" };
  return   { label: "REALIZADO",   bg: "rgba(16,185,129,0.10)",   color: "#10B981", border: "rgba(16,185,129,0.25)" };
}

function EntrenoList({ title, entrenamientos, hoy }: { title: string; entrenamientos: EntrenoItem[]; hoy: Date }) {
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
        {entrenamientos.map((e, i) => {
          const total   = e.asistencias.length;
          const present = e.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
          const pct     = total > 0 ? Math.round((present / total) * 100) : null;
          const color   = pct !== null ? pctColor(pct) : "var(--text-muted)";
          const fecha   = new Date(e.fecha);
          const badge   = badgeConf(e, hoy);

          return (
            <Link
              key={e.id}
              href={`/entrenamientos/${e.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                borderBottom: i < entrenamientos.length - 1 ? "1px solid var(--border)" : "none",
                textDecoration: "none", transition: "background 0.15s ease",
                background: e.suspendido ? "rgba(239,68,68,0.03)" : "transparent",
              }}
              className="hover:bg-[rgba(255,255,255,0.03)]"
            >
              {/* Date block */}
              <div style={{
                width: 44, flexShrink: 0,
                background: e.suspendido ? "rgba(239,68,68,0.08)" : "rgba(14,165,233,0.08)",
                border: `1px solid ${e.suspendido ? "rgba(239,68,68,0.2)" : "rgba(14,165,233,0.15)"}`,
                borderRadius: 10, padding: "6px 4px", textAlign: "center",
              }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: e.suspendido ? "#EF4444" : "#0EA5E9", lineHeight: 1 }}>
                  {fecha.toLocaleDateString("es-UY", { day: "numeric", timeZone: "America/Montevideo" })}
                </p>
                <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {fecha.toLocaleDateString("es-UY", { month: "short", timeZone: "America/Montevideo" })}
                </p>
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: e.suspendido ? "rgba(241,245,249,0.5)" : "#f1f5f9" }}>
                  {e.hora_inicio} – {e.hora_fin} · {e.lugar}
                </p>
                {e.suspendido && e.motivo_suspension ? (
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>
                    ⚠️ {e.motivo_suspension}
                  </p>
                ) : e.objetivo ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.objetivo}
                  </p>
                ) : null}
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 800,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                  }}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Attendance % (only for non-suspended) */}
              {!e.suspendido && pct !== null && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{present}/{total}</p>
                </div>
              )}

              <span style={{ color: "var(--border-bright)", fontSize: 16, flexShrink: 0 }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
