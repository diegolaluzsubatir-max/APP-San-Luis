import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { estadoDocumento, resultadoPartido } from "@/lib/utils";

const NOTAS_SEMANALES = [
  { objetivo: "Disfrutar cada entrenamiento",                    frase: "Jugamos porque nos hace felices." },
  { objetivo: "Ayudar a un compañero",                          frase: "Solos llegamos rápido, juntos llegamos lejos." },
  { objetivo: "Escuchar y respetar al otro",                    frase: "El respeto se entrena como el pase." },
  { objetivo: "Dar lo mejor sin miedo a equivocarse",           frase: "Los errores también enseñan." },
  { objetivo: "Sentirse parte del grupo",                       frase: "Esto es más que un equipo, es una familia." },
  { objetivo: "Mejorar un poquito cada día",                    frase: "No hay que ser el mejor, hay que ser mejor que ayer." },
  { objetivo: "Compartir dentro y fuera de la cancha",          frase: "Lo que se comparte, se disfruta el doble." },
  { objetivo: "Entrenar con compromiso",                        frase: "El esfuerzo de hoy es la sonrisa de mañana." },
  { objetivo: "Bancar la frustración y seguir",                 frase: "Caerse es parte del juego, levantarse también." },
  { objetivo: "Crecer como personas, no solo como jugadores",   frase: "Formamos personas antes que futbolistas." },
  { objetivo: "Venir con alegría",                              frase: "La camiseta se siente, no se explica." },
  { objetivo: "Recordar por qué empezamos",                     frase: "Por la diversión y por estar juntos." },
];

function getWeekOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  return Math.floor((dayOfYear + startOfYear.getDay()) / 7);
}

const TZ = "America/Montevideo";

function fmtDiaMes(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-UY", {
    weekday: "short", day: "numeric", month: "short", timeZone: TZ,
  }).toUpperCase();
}


export default async function DashboardPage() {
  const hoy      = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  const en7dias   = new Date(hoy.getTime() + 7 * 86400000);

  const [
    totalFichados, proximoEntreno, proximoPartido, partidosJugados,
    todasAsistencias, totalEntrenosMes, jugadoresFichados,
  ] = await Promise.all([
    prisma.jugador.count({ where: { fichado: true } }),
    prisma.entrenamiento.findFirst({ where: { fecha: { gte: hoy } }, orderBy: { fecha: "asc" } }),
    prisma.partido.findFirst({ where: { fecha: { gte: hoy }, estado: { in: ["pendiente", "próximo"] } }, orderBy: { fecha: "asc" } }),
    prisma.partido.findMany({ where: { estado: { in: ["jugado", "finalizado"] } } }),
    prisma.asistenciaEntrenamiento.findMany({ select: { estado: true } }),
    prisma.entrenamiento.count({ where: { fecha: { lt: hoy }, suspendido: false, asistencias: { some: {} } } }),
    prisma.jugador.findMany({
      include: { asistencias: { where: { entrenamiento: { fecha: { gte: inicioMes, lte: finMes } } } } },
    }),
  ]);

  let notasUrgentes = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notasUrgentes = await (prisma as any).nota.count({
      where: { estado: "pendiente", prioridad: { in: ["urgente", "importante"] } },
    });
  } catch { notasUrgentes = 0; }

  const golesStats = partidosJugados.reduce(
    (acc, p) => {
      if (p.goles_local !== null && p.goles_visita !== null) {
        acc.favor  += p.condicion === "local" ? p.goles_local  : p.goles_visita;
        acc.contra += p.condicion === "local" ? p.goles_visita : p.goles_local;
      }
      return acc;
    },
    { favor: 0, contra: 0 }
  );

  const presentes = todasAsistencias.filter(
    (a) => a.estado === "presente" || a.estado === "tardanza"
  ).length;
  const asistenciaPct = todasAsistencias.length > 0
    ? Math.round((presentes / todasAsistencias.length) * 100)
    : 0;
  const asistColor = asistenciaPct >= 85 ? "#10B981" : asistenciaPct >= 70 ? "#F59E0B" : "#EF4444";

  const alertasAsistencia = jugadoresFichados.filter((j) => {
    const t = j.asistencias.length;
    const p = j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
    return t > 0 && p / t < 0.7;
  });
  const alertasMedicas = jugadoresFichados.filter((j) => {
    const est = estadoDocumento(j.ficha_medica_vence);
    return est === "vencido" || est === "por-vencer";
  });
  const cumpleanos = jugadoresFichados.filter((j) => {
    if (!j.fecha_nacimiento) return false;
    const nac  = new Date(j.fecha_nacimiento);
    const prox = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
    if (prox < hoy) prox.setFullYear(hoy.getFullYear() + 1);
    return prox <= en7dias;
  });

  const alertasList: { count: number; label: string; href: string; color: string; icon: string }[] = [];
  if (notasUrgentes > 0)            alertasList.push({ count: notasUrgentes,            label: "Notas pendientes",  href: "/notas",               color: "#EF4444", icon: "📝" });
  if (alertasAsistencia.length > 0) alertasList.push({ count: alertasAsistencia.length, label: "Baja asistencia",   href: "/asistencia/reportes", color: "#F59E0B", icon: "⚠️" });
  if (alertasMedicas.length > 0)   alertasList.push({ count: alertasMedicas.length,    label: "Fichas médicas",    href: "/documentacion",       color: "#EF4444", icon: "🏥" });
  if (cumpleanos.length > 0)        alertasList.push({ count: cumpleanos.length,         label: "Cumpleaños 7 días", href: "/jugadores",           color: "#0EA5E9", icon: "🎂" });

  // ── Render ────────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "rgba(17,24,39,0.85)",
    backdropFilter: "blur(8px)",
    border: "1px solid #1e2d4a",
    borderRadius: 12,
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>

      {/* Saludo */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.02em" }}>
          ¡Bienvenido, Ernesto!
        </p>
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.4)", marginTop: 1 }}>Director Técnico · Liga Costa de Oro 2026</p>
      </div>

      {/* ── 2-col desktop / 1-col mobile ──────────────────────────────────── */}
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">

        {/* ── Columna izquierda ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* PRÓXIMO PARTIDO */}
          {proximoPartido ? (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#0EA5E9,#10B981)" }} />
              <div style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    Próximo Partido
                  </p>
                  <Link
                    href={`/partidos/${proximoPartido.id}/planificacion`}
                    style={{ fontSize: 10, color: "#0EA5E9", fontWeight: 700, textDecoration: "none" }}
                  >
                    Planificación →
                  </Link>
                </div>

                {/* Fecha + lugar en una línea */}
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10, fontFamily: "'Montserrat', sans-serif" }}>
                  {fmtDiaMes(proximoPartido.fecha)}
                  {proximoPartido.lugar ? <span style={{ fontWeight: 400, color: "rgba(241,245,249,0.45)" }}> · 📍 {proximoPartido.lugar}</span> : null}
                </p>

                {/* Shields row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", margin: "0 auto 4px",
                      background: "rgba(14,165,233,0.1)", border: "2px solid rgba(14,165,233,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/Escudo.png" alt="SL" style={{ width: 38, height: 38, objectFit: "contain" }} />
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.04em" }}>SAN LUIS</p>
                  </div>

                  <div style={{ padding: "0 12px", textAlign: "center" }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: "rgba(241,245,249,0.2)", letterSpacing: "0.04em" }}>VS</p>
                  </div>

                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", margin: "0 auto 4px",
                      background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>⚽</div>
                    <p style={{
                      fontSize: 10, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.04em",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: 90, margin: "0 auto",
                    }}>
                      {proximoPartido.rival.toUpperCase().substring(0, 14)}
                    </p>
                  </div>
                </div>

                {/* Chips */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
                  <DChip color="#0EA5E9">
                    {proximoPartido.condicion === "local" ? "🏠 LOCAL" : "✈️ VISITA"}
                  </DChip>
                  {proximoPartido.campeonato && (
                    <DChip color="rgba(241,245,249,0.38)">{proximoPartido.campeonato}</DChip>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: "14px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "rgba(241,245,249,0.35)" }}>Sin partidos pendientes</p>
            </div>
          )}

          {/* PRÓXIMO ENTRENAMIENTO */}
          {proximoEntreno ? (
            <div style={{ ...card, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>⚽</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>
                  Próximo Entrenamiento
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Montserrat', sans-serif" }}>
                  {fmtDiaMes(proximoEntreno.fecha)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(241,245,249,0.5)", marginTop: 1 }}>
                  {proximoEntreno.hora_inicio} hs · {proximoEntreno.lugar}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: "12px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(241,245,249,0.35)" }}>Sin entrenamientos programados</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha ────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* STATS GRID */}
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", borderBottom: "1px solid #1e2d4a" }}>
              <StatCell label="JUGADORES" value={totalFichados} />
              <div style={{ background: "#1e2d4a" }} />
              <StatCell label="ASIST. ENT." value={`${asistenciaPct}%`} color={asistColor} />
              <div style={{ background: "#1e2d4a" }} />
              <StatCell label="ENTRENOS" value={totalEntrenosMes} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr" }}>
              <StatCell label="PARTIDOS"  value={partidosJugados.length} />
              <div style={{ background: "#1e2d4a" }} />
              <StatCell label="G. FAVOR"  value={golesStats.favor}  color="#10B981" />
              <div style={{ background: "#1e2d4a" }} />
              <StatCell label="G. CONTRA" value={golesStats.contra} color="#EF4444" />
            </div>
          </div>

          {/* ALERTAS */}
          {alertasList.length > 0 && (
            <div style={{ ...card, overflow: "hidden" }}>
              {alertasList.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                    borderBottom: i < alertasList.length - 1 ? "1px solid #1e2d4a" : "none",
                    textDecoration: "none",
                  }}
                  className="hover:bg-[rgba(255,255,255,0.025)]"
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{a.label}</span>
                  <span style={{
                    minWidth: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: a.color, display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900,
                  }}>
                    {a.count}
                  </span>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Nota semanal ─────────────────────────────────────────────────── */}
      <NotaSemanal semana={getWeekOfYear(hoy)} />

    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function DChip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 800,
      letterSpacing: "0.05em", background: `${color}18`, color, border: `1px solid ${color}35`,
    }}>
      {children}
    </span>
  );
}

function StatCell({ label, value, color = "#f1f5f9" }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ padding: "10px 6px", textAlign: "center" }}>
      <p className="text-[28px] lg:text-[32px]" style={{ fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "rgba(241,245,249,0.38)",
        letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4,
      }}>
        {label}
      </p>
    </div>
  );
}
