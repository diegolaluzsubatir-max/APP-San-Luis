"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  partidoId: number;
  estado: string;
  notas: string | null;
  rival: string;
}

export default function AccionesClient({ partidoId, estado, notas, rival }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "suspender" | "anular" | "borrar">(null);
  const [motivo, setMotivo] = useState(notas ?? "");
  const [cargando, setCargando] = useState(false);

  async function suspender() {
    if (!motivo.trim()) return;
    setCargando(true);
    await fetch(`/api/partidos/${partidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "suspendido", notas: motivo.trim() }),
    });
    setCargando(false);
    setModal(null);
    router.refresh();
  }

  async function anularSuspension() {
    setCargando(true);
    await fetch(`/api/partidos/${partidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "pendiente", notas: null }),
    });
    setCargando(false);
    setModal(null);
    router.refresh();
  }

  async function borrar() {
    setCargando(true);
    await fetch(`/api/partidos/${partidoId}`, { method: "DELETE" });
    setCargando(false);
    router.push("/partidos");
  }

  const esSuspendido = estado === "suspendido";
  const esJugado = estado === "jugado" || estado === "finalizado";

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Acciones</p>
        <div className="flex flex-col gap-2">
          {!esJugado && (
            esSuspendido ? (
              <button
                onClick={() => setModal("anular")}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              >
                Anular suspensión
              </button>
            ) : (
              <button
                onClick={() => { setMotivo(""); setModal("suspender"); }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                Suspender partido
              </button>
            )
          )}
          <button
            onClick={() => setModal("borrar")}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Borrar partido
          </button>
        </div>
      </div>

      {modal === "suspender" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="font-black text-gray-900 text-base mb-1">Suspender partido</h3>
            <p className="text-sm text-gray-500 mb-4">San Luis vs {rival}</p>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Motivo de suspensión
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && suspender()}
              placeholder="Ej: suspendido por lluvia"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={cargando}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={suspender}
                disabled={cargando || !motivo.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {cargando ? "Guardando…" : "Suspender"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "anular" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="font-black text-gray-900 text-base mb-1">Anular suspensión</h3>
            <p className="text-sm text-gray-500 mb-4">San Luis vs {rival}</p>
            <p className="text-sm text-gray-700 mb-4">
              El partido volverá a marcarse como <strong>Próximo</strong> y se borrará el motivo de suspensión.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={cargando}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={anularSuspension}
                disabled={cargando}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {cargando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "borrar" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="font-black text-red-600 text-base mb-1">Borrar partido</h3>
            <p className="text-sm text-gray-500 mb-3">San Luis vs {rival}</p>
            <p className="text-sm text-gray-700 mb-2">
              ¿Seguro que querés borrar este partido?{" "}
              <strong>Esta acción no se puede deshacer.</strong>
            </p>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
              También se borrará toda la planificación asociada (convocatorias, minutos y estadísticas de los jugadores).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={cargando}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={borrar}
                disabled={cargando}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cargando ? "Borrando…" : "Borrar partido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
