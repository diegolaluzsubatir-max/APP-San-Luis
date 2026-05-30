export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fmtFechaLarga, resultadoPartido } from "@/lib/utils";
import ResultadoClient from "./ResultadoClient";

interface Props { params: Promise<{ id: string }> }

export default async function PartidoDetallePage({ params }: Props) {
  const { id } = await params;
  const pid = parseInt(id);
  if (isNaN(pid)) notFound();

  const partido = await prisma.partido.findUnique({
    where: { id: pid },
    include: {
      planificacion: {
        include: { jugador: true },
        orderBy: { jugador: { numero_camiseta: "asc" } },
      },
    },
  });
  if (!partido) notFound();

  const r = (partido.estado === "jugado" || partido.estado === "finalizado") ? resultadoPartido(partido) : null;

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/partidos" className="text-sm text-[#0047AB] hover:underline">← Volver</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">San Luis vs {partido.rival}</h2>
            <p className="text-sm text-gray-600 mt-1">{fmtFechaLarga(partido.fecha)}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-blue-50 text-[#0047AB] px-2 py-1 rounded-full font-medium">
                {partido.condicion === "local" ? "🏠 Local" : "✈️ Visitante"}
              </span>
              {partido.campeonato && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {partido.campeonato}
                </span>
              )}
            </div>
          </div>
          {r ? (
            <div className="text-center shrink-0">
              <div className="text-3xl font-black">
                {partido.condicion === "local"
                  ? `${partido.goles_local ?? 0}–${partido.goles_visita ?? 0}`
                  : `${partido.goles_visita ?? 0}–${partido.goles_local ?? 0}`}
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                r === "V" ? "bg-green-100 text-green-700" :
                r === "E" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {r === "V" ? "Victoria" : r === "E" ? "Empate" : "Derrota"}
              </span>
            </div>
          ) : (
            <span className="text-xs bg-blue-50 text-[#0047AB] px-2 py-1 rounded-full font-medium">Pendiente</span>
          )}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <Link href={`/partidos/${partido.id}/planificacion`}
            className="flex-1 text-center py-2 bg-[#0047AB] hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors">
            Ver planificación
          </Link>
        </div>
      </div>

      {/* Registrar resultado */}
      {partido.estado !== "jugado" && partido.estado !== "finalizado" && (
        <ResultadoClient
          partidoId={partido.id}
          condicion={partido.condicion}
          golesLocalInit={partido.goles_local}
          golesVisitaInit={partido.goles_visita}
        />
      )}

      {/* Jugadores convocados */}
      {partido.planificacion.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-700">Jugadores convocados</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Jugador</th>
                <th className="text-center px-3 py-2">Min</th>
                <th className="text-center px-3 py-2">⚽</th>
                <th className="text-center px-3 py-2">🅰️</th>
              </tr>
            </thead>
            <tbody>
              {partido.planificacion.map((pp) => (
                <tr key={pp.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 text-gray-400 text-xs">{pp.jugador.numero_camiseta ?? "—"}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {pp.jugador.nombre} {pp.jugador.apellido}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{pp.minutos}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-800">{pp.goles || "—"}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{pp.asistencias_stat || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
