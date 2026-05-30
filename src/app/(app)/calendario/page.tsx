import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CalendarioPage() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const inicioMes = new Date(year, month, 1);
  const finMes    = new Date(year, month + 1, 0, 23, 59, 59);
  const en30      = new Date(hoy.getTime() + 30 * 86400000);

  const [entrenamientos, partidos, proximos] = await Promise.all([
    prisma.entrenamiento.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } },
      orderBy: { fecha: "asc" },
    }),
    prisma.partido.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } },
      orderBy: { fecha: "asc" },
    }),
    prisma.entrenamiento.findMany({
      where: { fecha: { gte: hoy, lte: en30 } },
      orderBy: { fecha: "asc" },
      take: 8,
    }),
  ]);

  const proxPartidos = await prisma.partido.findMany({
    where: { fecha: { gte: hoy, lte: en30 }, estado: "pendiente" },
    orderBy: { fecha: "asc" },
    take: 5,
  });

  // Build event map: day → types
  const dayMap = new Map<number, Set<"entreno" | "partido">>();
  for (const e of entrenamientos) {
    const d = new Date(e.fecha).getDate();
    if (!dayMap.has(d)) dayMap.set(d, new Set());
    dayMap.get(d)!.add("entreno");
  }
  for (const p of partidos) {
    const d = new Date(p.fecha).getDate();
    if (!dayMap.has(d)) dayMap.set(d, new Set());
    dayMap.get(d)!.add("partido");
  }

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDow + 6) % 7; // Monday-based
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthName = hoy.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  const upcomingEvents = [
    ...proximos.map((e) => ({
      fecha: e.fecha,
      tipo: "entreno" as const,
      label: e.objetivo ?? "Entrenamiento",
      sub: `${e.hora_inicio} · ${e.lugar}`,
      href: `/asistencia/${e.id}`,
    })),
    ...proxPartidos.map((p) => ({
      fecha: p.fecha,
      tipo: "partido" as const,
      label: `vs ${p.rival}`,
      sub: p.lugar ?? (p.condicion === "local" ? "Local" : "Visitante"),
      href: `/partidos/${p.id}`,
    })),
  ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  return (
    <div className="space-y-5 max-w-xl">

      {/* Calendar card */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "16px",
      }}>
        {/* Month title */}
        <p style={{
          fontSize: 14, fontWeight: 800, color: "#f1f5f9",
          textTransform: "capitalize", textAlign: "center", marginBottom: 14,
          letterSpacing: "0.04em",
        }}>
          {monthName}
        </p>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
          {["L","M","X","J","V","S","D"].map((d) => (
            <div key={d} style={{
              textAlign: "center", fontSize: 10, fontWeight: 700,
              color: "var(--text-muted)", padding: "3px 0",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((cell, i) => {
            if (cell === null) return <div key={`e-${i}`} />;
            const types = dayMap.get(cell);
            const isToday = cell === hoy.getDate();
            return (
              <div key={cell} style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: isToday ? "rgba(14,165,233,0.18)" : "transparent",
                border: `1px solid ${isToday ? "rgba(14,165,233,0.4)" : "transparent"}`,
                gap: 2,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 900 : 500, lineHeight: 1,
                  color: isToday ? "#0EA5E9" : "var(--text-primary)",
                }}>
                  {cell}
                </span>
                {types && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {types.has("entreno") && (
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />
                    )}
                    {types.has("partido") && (
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444" }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Entrenamiento</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Partido</span>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
          }}>
            Próximos 30 días
          </p>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 12, overflow: "hidden",
          }}>
            {upcomingEvents.map((ev, i) => {
              const d = new Date(ev.fecha);
              const isPartido = ev.tipo === "partido";
              return (
                <Link
                  key={i}
                  href={ev.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px",
                    borderBottom: i < upcomingEvents.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                  }}
                >
                  {/* Date block */}
                  <div style={{
                    width: 40, textAlign: "center", flexShrink: 0,
                  }}>
                    <p style={{
                      fontSize: 22, fontWeight: 900, lineHeight: 1,
                      color: isPartido ? "#EF4444" : "#10B981",
                    }}>
                      {d.getDate()}
                    </p>
                    <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {d.toLocaleDateString("es-UY", { month: "short" })}
                    </p>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.label}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{ev.sub}</p>
                  </div>

                  <span style={{
                    fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                    background: isPartido ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                    color: isPartido ? "#EF4444" : "#10B981",
                    border: `1px solid ${isPartido ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                  }}>
                    {isPartido ? "Partido" : "Entreno"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, paddingTop: 20 }}>
          No hay eventos en los próximos 30 días
        </p>
      )}
    </div>
  );
}
