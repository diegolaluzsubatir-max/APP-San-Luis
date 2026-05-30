"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  partidoId: number;
  condicion: string;
  golesLocalInit: number | null;
  golesVisitaInit: number | null;
}

export default function ResultadoClient({ partidoId, condicion, golesLocalInit, golesVisitaInit }: Props) {
  const [golesLocal,   setGolesLocal]   = useState(golesLocalInit   ?? 0);
  const [golesVisita,  setGolesVisita]  = useState(golesVisitaInit  ?? 0);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function guardar() {
    setGuardando(true);
    await fetch(`/api/partidos/${partidoId}/resultado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goles_local: golesLocal, goles_visita: golesVisita }),
    });
    setGuardando(false);
    router.refresh();
  }

  const localLabel   = condicion === "local" ? "San Luis" : "Rival";
  const visitaLabel  = condicion === "local" ? "Rival" : "San Luis";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="font-bold text-sm text-gray-700 mb-4">Registrar resultado</h3>
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">{localLabel}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setGolesLocal(Math.max(0, golesLocal - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600">−</button>
            <span className="text-2xl font-black text-gray-900 w-8 text-center">{golesLocal}</span>
            <button onClick={() => setGolesLocal(golesLocal + 1)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600">+</button>
          </div>
        </div>
        <span className="text-xl font-black text-gray-300">–</span>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">{visitaLabel}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setGolesVisita(Math.max(0, golesVisita - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600">−</button>
            <span className="text-2xl font-black text-gray-900 w-8 text-center">{golesVisita}</span>
            <button onClick={() => setGolesVisita(golesVisita + 1)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-600">+</button>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <button onClick={guardar} disabled={guardando}
          className="px-6 py-2 bg-[#0047AB] hover:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
          {guardando ? "Guardando…" : "Guardar resultado"}
        </button>
      </div>
    </div>
  );
}
