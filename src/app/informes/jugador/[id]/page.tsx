import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { fmtFecha, estadoDocumento, labelDoc, iniciales } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

interface Props { params: Promise<{ id: string }> }

export default async function InformeJugadorPage({ params }: Props) {
  const { id } = await params;
  const jid = parseInt(id);
  if (isNaN(jid)) notFound();

  const j = await prisma.jugador.findUnique({
    where: { id: jid },
    include: {
      participaciones: { include: { partido: true } },
      asistencias: { include: { entrenamiento: true } },
      evaluaciones: { orderBy: { fecha: "asc" } },
    },
  });
  if (!j) notFound();

  const goles = j.participaciones.reduce((s, p) => s + p.goles, 0);
  const asist = j.participaciones.reduce((s, p) => s + p.asistencias_stat, 0);
  const mins  = j.participaciones.reduce((s, p) => s + p.minutos, 0);
  const pctAnual = j.asistencias.length > 0
    ? Math.round(j.asistencias.filter((a) => a.estado === "presente" || a.estado === "tardanza").length / j.asistencias.length * 100)
    : null;

  const ultimaEval = j.evaluaciones.at(-1);
  const CATS = [
    ["conducta","Conducta"],["compromiso","Compromiso"],["respeto","Respeto"],["companerismo","Compañerismo"],
    ["control_balon","Control de balón"],["pase","Pase"],["recepcion","Recepción"],["definicion","Definición"],
    ["comprension_tactica","Comprensión táctica"],["velocidad","Velocidad"],["coordinacion","Coordinación"],
  ];

  return (
    <>
      <style>{`
        @media print { @page { size: A4; margin: 1.5cm; } }
        body { font-family: Arial, sans-serif; background: white; color: #1a1a1a; }
      `}</style>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <PrintButton />

        <div className="flex items-center gap-4 border-b-2 border-[#0047AB] pb-4">
          <div className="w-14 h-14 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-black text-xl shrink-0">
            {iniciales(j.nombre, j.apellido)}
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0047AB]">{j.nombre} {j.apellido}</h1>
            <p className="text-sm text-gray-600">{j.posicion ?? ""} {j.numero_camiseta ? `· #${j.numero_camiseta}` : ""}</p>
            <p className="text-xs text-gray-400">Club Estudiantil San Luis · Cat. 2017 Mixto · {new Date().getFullYear()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Datos personales">
            <Row label="CI" value={j.cedula ?? "—"} />
            <Row label="Nacimiento" value={fmtFecha(j.fecha_nacimiento)} />
            <Row label="Mutualista" value={j.mutualista ?? "—"} />
          </Section>
          <Section title="Documentación">
            <Row label="CI" value={labelDoc(estadoDocumento(j.ci_vencimiento))} />
            <Row label="Ficha médica" value={labelDoc(estadoDocumento(j.ficha_medica_vence))} />
            <Row label="Autorización" value={j.autorizacion ? "Sí" : "No"} />
          </Section>
        </div>

        <Section title="Estadísticas de temporada">
          <div className="grid grid-cols-4 gap-3 mt-2">
            {[
              { label: "Partidos", val: j.participaciones.length },
              { label: "Goles", val: goles },
              { label: "Asistencias", val: asist },
              { label: "Minutos", val: mins },
            ].map((s) => (
              <div key={s.label} className="text-center border border-gray-200 rounded-lg p-2">
                <p className="text-2xl font-black text-[#0047AB]">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={`Asistencia (${pctAnual !== null ? `${pctAnual}% anual` : "Sin datos"})`}>
          <p className="text-sm text-gray-600">{j.asistencias.length} entrenamientos registrados</p>
        </Section>

        {ultimaEval && (
          <Section title={`Evaluación técnica — ${fmtFecha(ultimaEval.fecha)}`}>
            <div className="space-y-1.5 mt-2">
              {CATS.map(([key, label]) => {
                const val = (ultimaEval as Record<string, unknown>)[key] as number;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-36 shrink-0">{label}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((n) => (
                        <div key={n} className={`w-4 h-4 rounded-sm ${n<=val?"bg-[#0047AB]":"bg-gray-100"}`}/>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#0047AB]">{val}/5</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
