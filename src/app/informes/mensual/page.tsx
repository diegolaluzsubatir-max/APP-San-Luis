import { prisma } from "@/lib/prisma";
import { fmtFecha, resultadoPartido } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export default async function InformeMensualPage() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  const mesLabel  = hoy.toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  const jugadores = await prisma.jugador.findMany({
    where: { fichado: true },
    orderBy: [{ numero_camiseta: "asc" }],
    include: {
      asistencias: {
        where: { entrenamiento: { fecha: { gte: inicioMes, lte: finMes } } },
      },
      participaciones: {
        where: { partido: { fecha: { gte: inicioMes, lte: finMes } } },
      },
    },
  });

  const partidos = await prisma.partido.findMany({
    where: { fecha: { gte: inicioMes, lte: finMes } },
    include: { planificacion: { include: { jugador: true } } },
    orderBy: { fecha: "asc" },
  });

  const entrenamientos = await prisma.entrenamiento.findMany({
    where: { fecha: { gte: inicioMes, lte: finMes }, estado: "realizado" },
    orderBy: { fecha: "asc" },
  });

  return (
    <>
      <style>{`
        @media print { @page { size: A4 landscape; margin: 1.5cm; } .no-print { display:none; } }
        body { font-family: Arial, sans-serif; background: white; color: #1a1a1a; font-size: 11pt; }
      `}</style>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <PrintButton />

        <div className="border-b-2 border-[#0047AB] pb-3">
          <h1 className="text-2xl font-black text-[#0047AB]">Informe Mensual — {mesLabel}</h1>
          <p className="text-sm text-gray-500">Club Estudiantil San Luis · Cat. 2017 Mixto</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Entrenamientos", val: entrenamientos.length },
            { label: "Partidos", val: partidos.length },
            { label: "Jugadores fichados", val: jugadores.length },
          ].map((s) => (
            <div key={s.label} className="border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-[#0047AB]">{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Partidos */}
        {partidos.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">
              Partidos del mes
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400">
                  <th className="text-left py-1">Fecha</th>
                  <th className="text-left py-1">Rival</th>
                  <th className="text-center py-1">Condición</th>
                  <th className="text-center py-1">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((p) => {
                  const r = p.estado === "jugado" ? resultadoPartido(p) : null;
                  return (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-1.5">{fmtFecha(p.fecha)}</td>
                      <td className="py-1.5 font-medium">vs {p.rival}</td>
                      <td className="py-1.5 text-center">{p.condicion === "local" ? "Local" : "Visitante"}</td>
                      <td className="py-1.5 text-center">
                        {p.estado === "jugado" && p.goles_local !== null
                          ? `${p.condicion === "local" ? p.goles_local : p.goles_visita}–${p.condicion === "local" ? p.goles_visita : p.goles_local} (${r})`
                          : "Pendiente"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Asistencia grupal */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">
            Asistencia a entrenamientos
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400">
                <th className="text-left py-1 pr-3">#</th>
                <th className="text-left py-1">Jugador</th>
                <th className="text-center py-1">Presentes</th>
                <th className="text-center py-1">Total</th>
                <th className="text-center py-1">%</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((j) => {
                const total   = j.asistencias.length;
                const present = j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
                const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr key={j.id} className="border-b border-gray-50">
                    <td className="py-1 text-xs text-gray-400 pr-3">{j.numero_camiseta ?? "—"}</td>
                    <td className="py-1 font-medium">{j.nombre} {j.apellido}</td>
                    <td className="py-1 text-center">{present}</td>
                    <td className="py-1 text-center text-gray-500">{total}</td>
                    <td className={`py-1 text-center font-bold ${pct >= 85 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                      {total > 0 ? `${pct}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tabla de minutos */}
        {partidos.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-3">
              Tabla de minutos del mes
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400">
                  <th className="text-left py-1">Jugador</th>
                  <th className="text-center py-1">Minutos</th>
                  <th className="text-center py-1">Goles</th>
                  <th className="text-center py-1">Asist.</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j) => {
                  const mins  = j.participaciones.reduce((s, p) => s + p.minutos, 0);
                  const goles = j.participaciones.reduce((s, p) => s + p.goles, 0);
                  const asis  = j.participaciones.reduce((s, p) => s + p.asistencias_stat, 0);
                  return (
                    <tr key={j.id} className="border-b border-gray-50">
                      <td className="py-1 font-medium">{j.nombre} {j.apellido}</td>
                      <td className="py-1 text-center">{mins}</td>
                      <td className="py-1 text-center">{goles || "—"}</td>
                      <td className="py-1 text-center text-gray-500">{asis || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
          Generado el {fmtFecha(new Date())} · Club Estudiantil San Luis
        </p>
      </div>
    </>
  );
}
