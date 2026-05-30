import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { fmtFecha, fmtFechaLarga, iniciales } from "@/lib/utils";

interface Props { params: Promise<{ jugadorId: string }> }

export default async function FamiliaPage({ params }: Props) {
  const { jugadorId } = await params;
  const jid = parseInt(jugadorId);
  if (isNaN(jid)) notFound();

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  const j = await prisma.jugador.findUnique({
    where: { id: jid },
    include: {
      asistencias: {
        where: { entrenamiento: { fecha: { gte: inicioMes, lte: finMes } } },
      },
    },
  });
  if (!j) notFound();

  // Próximos eventos
  const proximoPartido = await prisma.partido.findFirst({
    where: { fecha: { gte: hoy }, estado: "pendiente" },
    orderBy: { fecha: "asc" },
  });
  const proximoEntreno = await prisma.entrenamiento.findFirst({
    where: { fecha: { gte: hoy } },
    orderBy: { fecha: "asc" },
  });

  const pctMes = j.asistencias.length > 0
    ? Math.round(j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length / j.asistencias.length * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#0047AB] text-white px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#0047AB] flex items-center justify-center font-black text-sm shrink-0">
            SL
          </div>
          <div>
            <p className="font-bold text-sm">Club Estudiantil San Luis</p>
            <p className="text-blue-200 text-xs">Portal Familias</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Jugador */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-black text-lg shrink-0">
            {iniciales(j.nombre, j.apellido)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{j.nombre} {j.apellido}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {j.numero_camiseta && <span className="text-xs bg-blue-50 text-[#0047AB] px-2 py-0.5 rounded-full">#{j.numero_camiseta}</span>}
              {j.posicion && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{j.posicion}</span>}
            </div>
          </div>
        </div>

        {/* Asistencia del mes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Asistencia este mes</p>
          {pctMes !== null ? (
            <>
              <p className={`text-3xl font-black ${pctMes >= 85 ? "text-green-600" : pctMes >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                {pctMes}%
              </p>
              <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pctMes >= 85 ? "bg-green-500" : pctMes >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${pctMes}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Sin registros este mes</p>
          )}
        </div>

        {/* Próximos eventos */}
        {(proximoPartido || proximoEntreno) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Próximos eventos</p>
            <div className="space-y-2">
              {proximoPartido && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-xl">⚽</span>
                  <div>
                    <p className="text-sm font-bold text-[#0047AB]">vs {proximoPartido.rival}</p>
                    <p className="text-xs text-gray-600">{fmtFechaLarga(proximoPartido.fecha)}</p>
                    <p className="text-xs text-gray-500">{proximoPartido.condicion === "local" ? "🏠 Cancha propia" : "✈️ De visitante"}</p>
                  </div>
                </div>
              )}
              {proximoEntreno && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">🏋️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Entrenamiento</p>
                    <p className="text-xs text-gray-600">{fmtFecha(proximoEntreno.fecha)} — {proximoEntreno.hora_inicio}</p>
                    <p className="text-xs text-gray-500">{proximoEntreno.lugar}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
