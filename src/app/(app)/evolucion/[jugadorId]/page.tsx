import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fmtFecha } from "@/lib/utils";
import EvolucionClient from "./EvolucionClient";

interface Props { params: Promise<{ jugadorId: string }> }

const DEFAULT_EVAL = {
  conducta:3, compromiso:3, respeto:3, companerismo:3,
  control_balon:3, pase:3, recepcion:3, definicion:3,
  comprension_tactica:3, velocidad:3, coordinacion:3, observaciones:"",
};

export default async function EvolucionJugadorPage({ params }: Props) {
  const { jugadorId } = await params;
  const jid = parseInt(jugadorId);
  if (isNaN(jid)) notFound();

  const jugador = await prisma.jugador.findUnique({ where: { id: jid } });
  if (!jugador) notFound();

  const evaluaciones = await prisma.evaluacion.findMany({
    where: { jugadorId: jid },
    orderBy: { fecha: "desc" },
  });

  const ultima    = evaluaciones[0];
  const primera   = evaluaciones.at(-1);
  const evalInit  = ultima
    ? { conducta:ultima.conducta, compromiso:ultima.compromiso, respeto:ultima.respeto, companerismo:ultima.companerismo,
        control_balon:ultima.control_balon, pase:ultima.pase, recepcion:ultima.recepcion, definicion:ultima.definicion,
        comprension_tactica:ultima.comprension_tactica, velocidad:ultima.velocidad, coordinacion:ultima.coordinacion,
        observaciones:ultima.observaciones ?? "" }
    : DEFAULT_EVAL;

  const primeraSerial = primera && primera.id !== ultima?.id
    ? { conducta:primera.conducta, compromiso:primera.compromiso, respeto:primera.respeto, companerismo:primera.companerismo,
        control_balon:primera.control_balon, pase:primera.pase, recepcion:primera.recepcion, definicion:primera.definicion,
        comprension_tactica:primera.comprension_tactica, velocidad:primera.velocidad, coordinacion:primera.coordinacion }
    : null;

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/evolucion" className="text-sm text-[#0047AB] hover:underline">← Volver</Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="font-bold text-gray-900 text-lg">{jugador.nombre} {jugador.apellido}</h2>
        <p className="text-sm text-gray-500">{evaluaciones.length} evaluaciones registradas</p>
      </div>

      {evaluaciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Historial</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {evaluaciones.map((ev) => {
              const prom = Math.round(([ev.conducta,ev.compromiso,ev.respeto,ev.companerismo,ev.control_balon,ev.pase,ev.recepcion,ev.definicion,ev.comprension_tactica,ev.velocidad,ev.coordinacion].reduce((s,v)=>s+v,0)/11)*10)/10;
              return (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm text-gray-600 flex-1">{fmtFecha(ev.fecha)}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((n)=>(
                      <div key={n} className={`w-3 h-3 rounded-sm ${n<=Math.round(prom)?"bg-[#0047AB]":"bg-gray-100"}`}/>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#0047AB] w-8 text-right">{prom}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EvolucionClient
        jugadorId={jid}
        evalInicial={evalInit}
        primeraEval={primeraSerial}
      />
    </div>
  );
}
