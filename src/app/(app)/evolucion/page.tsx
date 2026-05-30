import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtFecha } from "@/lib/utils";

function scoreColor(val: number) {
  if (val >= 4) return "#10B981";
  if (val >= 3) return "#0EA5E9";
  return "#F59E0B";
}

export default async function EvolucionPage() {
  const jugadores = await prisma.jugador.findMany({
    where: { fichado: true },
    orderBy: [{ numero_camiseta: "asc" }],
    include: { evaluaciones: { orderBy: { fecha: "desc" }, take: 1 } },
  });

  return (
    <div className="max-w-xl">
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {jugadores.map((j, i) => {
          const ultima = j.evaluaciones[0];
          const promedio = ultima
            ? Math.round(
                ([ultima.conducta, ultima.compromiso, ultima.respeto, ultima.companerismo,
                  ultima.control_balon, ultima.pase, ultima.recepcion, ultima.definicion,
                  ultima.comprension_tactica, ultima.velocidad, ultima.coordinacion]
                  .reduce((s, v) => s + v, 0) / 11) * 10
              ) / 10
            : null;
          const color = promedio !== null ? scoreColor(promedio) : "var(--text-muted)";

          return (
            <Link
              key={j.id}
              href={`/evolucion/${j.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 16px",
                borderBottom: i < jugadores.length - 1 ? "1px solid var(--border)" : "none",
                textDecoration: "none", transition: "background 0.15s ease",
              }}
              className="hover:bg-[rgba(255,255,255,0.03)]"
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "rgba(14,165,233,0.1)", border: "2px solid rgba(14,165,233,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Escudo.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                  {j.nombre} {j.apellido}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                  {ultima ? `Última eval: ${fmtFecha(ultima.fecha)}` : "Sin evaluaciones"}
                </p>
              </div>

              {promedio !== null ? (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{promedio}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>/5</p>
                </div>
              ) : (
                <div style={{ width: 28 }} />
              )}

              <span style={{ color: "var(--border-bright)", fontSize: 16, flexShrink: 0 }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
