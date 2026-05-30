import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtFecha, estadoDocumento, labelDoc, diasHasta } from "@/lib/utils";

function docColor(est: string) {
  if (est === "vencido")    return "#EF4444";
  if (est === "por-vencer") return "#F59E0B";
  if (est === "vigente")    return "#10B981";
  return "var(--text-muted)";
}

export default async function DocumentacionPage() {
  const jugadores = await prisma.jugador.findMany({
    where: { fichado: true },
    orderBy: [{ numero_camiseta: "asc" }],
  });

  const alertas = jugadores.filter((j) =>
    estadoDocumento(j.ci_vencimiento)     !== "vigente" ||
    estadoDocumento(j.ficha_medica_vence) !== "vigente" ||
    !j.autorizacion
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 12, padding: "14px 16px",
        }}>
          <p style={{ fontWeight: 800, color: "#EF4444", fontSize: 13, marginBottom: 8 }}>
            ⚠️ {alertas.length} jugadores con documentación pendiente
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {alertas.map((j) => {
              const estCI  = estadoDocumento(j.ci_vencimiento);
              const estMed = estadoDocumento(j.ficha_medica_vence);
              const msgs: string[] = [];
              if (estCI  !== "vigente") msgs.push(`CI ${labelDoc(estCI).toLowerCase()}`);
              if (estMed !== "vigente") msgs.push(`Ficha ${labelDoc(estMed).toLowerCase()}`);
              if (!j.autorizacion)      msgs.push("Sin autorización");
              return (
                <li key={j.id} style={{ fontSize: 12, color: "rgba(239,68,68,0.9)" }}>
                  <Link href={`/jugadores/${j.id}`} style={{ fontWeight: 700, color: "#EF4444", textDecoration: "none" }}>
                    {j.nombre} {j.apellido}
                  </Link>
                  {" — "}{msgs.join(", ")}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto auto auto",
          padding: "10px 16px", borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.03)",
        }}>
          {["Jugador", "CI", "Ficha méd.", "Aut."].map((h) => (
            <span key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", textAlign: h === "Jugador" ? "left" : "center" }}>
              {h}
            </span>
          ))}
        </div>

        {jugadores.map((j, i) => {
          const estCI  = estadoDocumento(j.ci_vencimiento);
          const estMed = estadoDocumento(j.ficha_medica_vence);
          return (
            <Link
              key={j.id}
              href={`/jugadores/${j.id}`}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                alignItems: "center", gap: 8,
                padding: "12px 16px",
                borderBottom: i < jugadores.length - 1 ? "1px solid var(--border)" : "none",
                textDecoration: "none", transition: "background 0.15s ease",
              }}
              className="hover:bg-[rgba(255,255,255,0.02)]"
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {j.nombre} {j.apellido}
                </p>
                {j.numero_camiseta !== null && (
                  <p style={{ fontSize: 10, color: "var(--text-muted)" }}>#{j.numero_camiseta}</p>
                )}
              </div>

              <DocCell est={estCI} fecha={j.ci_vencimiento} />
              <DocCell est={estMed} fecha={j.ficha_medica_vence} />

              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 800,
                  background: j.autorizacion ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color: j.autorizacion ? "#10B981" : "#EF4444",
                  border: `1px solid ${j.autorizacion ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {j.autorizacion ? "Sí" : "No"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { color: "#10B981", label: "Vigente" },
          { color: "#F59E0B", label: "Por vencer (<30d)" },
          { color: "#EF4444", label: "Vencido" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocCell({ est, fecha }: { est: string; fecha: Date | string | null | undefined }) {
  const color = docColor(est);
  const dias  = diasHasta(fecha);
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <span style={{
        fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800,
        background: `${color}15`, color, border: `1px solid ${color}35`,
        display: "block", marginBottom: 1,
      }}>
        {labelDoc(est)}
      </span>
      {fecha && (
        <span style={{ fontSize: 9, color: "var(--text-muted)", display: "block" }}>
          {est !== "vigente" && dias < 0 ? `hace ${Math.abs(dias)}d` : est !== "vigente" ? `en ${dias}d` : fmtFecha(fecha).substring(0, 5)}
        </span>
      )}
    </div>
  );
}
