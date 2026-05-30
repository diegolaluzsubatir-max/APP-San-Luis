"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIAS = [
  { key: "conducta",            label: "Conducta",             grupo: "Actitudinal" },
  { key: "compromiso",          label: "Compromiso",           grupo: "Actitudinal" },
  { key: "respeto",             label: "Respeto",              grupo: "Actitudinal" },
  { key: "companerismo",        label: "Compañerismo",         grupo: "Actitudinal" },
  { key: "control_balon",       label: "Control de balón",     grupo: "Técnico"     },
  { key: "pase",                label: "Pase",                 grupo: "Técnico"     },
  { key: "recepcion",           label: "Recepción",            grupo: "Técnico"     },
  { key: "definicion",          label: "Definición",           grupo: "Técnico"     },
  { key: "comprension_tactica", label: "Comprensión táctica",  grupo: "Táctico/Físico" },
  { key: "velocidad",           label: "Velocidad",            grupo: "Táctico/Físico" },
  { key: "coordinacion",        label: "Coordinación",         grupo: "Táctico/Físico" },
] as const;

type CatKey = typeof CATEGORIAS[number]["key"];

interface EvalInit extends Record<CatKey, number> {
  observaciones?: string;
}

interface Props {
  jugadorId: number;
  evalInicial: EvalInit;
  primeraEval: Partial<EvalInit> | null;
}

export default function EvolucionClient({ jugadorId, evalInicial, primeraEval }: Props) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<CatKey, number>>(evalInicial);
  const [obs, setObs] = useState(evalInicial.observaciones ?? "");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");

  async function guardar() {
    setGuardando(true);
    setMsg("");
    const res = await fetch(`/api/evaluaciones/${jugadorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...vals, observaciones: obs }),
    });
    if (!res.ok) { setMsg("Error al guardar."); setGuardando(false); return; }
    setMsg("Evaluación guardada.");
    router.refresh();
    setGuardando(false);
  }

  const grupos = [...new Set(CATEGORIAS.map((c) => c.grupo))];

  return (
    <div className="space-y-6">
      {/* Comparación primera vs última */}
      {primeraEval && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            Comparación: primera vs última evaluación
          </h3>
          <div className="space-y-2">
            {CATEGORIAS.map((cat) => {
              const prim = (primeraEval as Record<string, unknown>)[cat.key] as number | undefined ?? 0;
              const act  = vals[cat.key];
              const diff = act - prim;
              return (
                <div key={cat.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{cat.label}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-3 bg-blue-200 rounded-full" style={{ width: `${(prim / 5) * 100}%`, minWidth: "4px", maxWidth: "50%" }} />
                    <div className="h-3 bg-[#0047AB] rounded-full" style={{ width: `${(act / 5) * 100}%`, minWidth: "4px", maxWidth: "50%" }} />
                  </div>
                  <span className={`text-xs font-bold w-8 text-right shrink-0 ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"}`}>
                    {diff > 0 ? `+${diff}` : diff === 0 ? "=" : diff}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-200 inline-block" />Primera</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#0047AB] inline-block" />Actual</span>
          </div>
        </div>
      )}

      {/* Formulario nueva evaluación */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Nueva evaluación</h3>
        <div className="space-y-5">
          {grupos.map((grupo) => (
            <div key={grupo}>
              <p className="text-xs font-bold text-[#0047AB] mb-3 uppercase tracking-wide">{grupo}</p>
              <div className="space-y-3">
                {CATEGORIAS.filter((c) => c.grupo === grupo).map((cat) => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 shrink-0">{cat.label}</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setVals((p) => ({ ...p, [cat.key]: n }))}
                          className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                            vals[cat.key] >= n
                              ? "bg-[#0047AB] text-white"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-[#0047AB] w-4">{vals[cat.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB]" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={guardar} disabled={guardando}
            className="px-5 py-2.5 bg-[#0047AB] hover:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
            {guardando ? "Guardando…" : "💾 Guardar evaluación"}
          </button>
          {msg && <span className={`text-sm font-medium ${msg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
