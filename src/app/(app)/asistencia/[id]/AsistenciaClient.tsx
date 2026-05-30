"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EstadoAsistencia = "presente" | "tardanza" | "ausente" | "justificado";

interface Jugador { id: number; nombre: string; apellido: string; numero_camiseta: number | null; fichado: boolean }
interface RegistroInit { jugadorId: number; estado: EstadoAsistencia; observaciones: string }

interface Props {
  entrenamientoId: number;
  jugadores: Jugador[];
  registrosIniciales: RegistroInit[];
  totalJugadores: number;
}

const BTNS = [
  { valor: "presente" as EstadoAsistencia, label: "ASISTE", bg: "#10B981", text: "#fff",   shadow: "rgba(16,185,129,0.5)"  },
  { valor: "ausente"  as EstadoAsistencia, label: "FALTA",  bg: "#EF4444", text: "#fff",   shadow: "rgba(239,68,68,0.5)"   },
  { valor: "tardanza" as EstadoAsistencia, label: "TARDE",  bg: "#F59E0B", text: "#000",   shadow: "rgba(245,158,11,0.5)"  },
];

export default function AsistenciaClient({ entrenamientoId, jugadores, registrosIniciales, totalJugadores }: Props) {
  const router = useRouter();
  const [registros, setRegistros] = useState<Record<number, { estado: EstadoAsistencia; obs: string }>>(
    () => Object.fromEntries(registrosIniciales.map((r) => [r.jugadorId, { estado: r.estado, obs: r.observaciones }]))
  );
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

  // Cantidad de jugadores que difieren del estado "presente" (default)
  const modificaciones = Object.values(registros).filter((r) => r.estado !== "presente").length;

  function setEstado(jugadorId: number, estado: EstadoAsistencia) {
    setRegistros((prev) => ({ ...prev, [jugadorId]: { ...prev[jugadorId], estado } }));
    setMsg(null);
  }

  function setObs(jugadorId: number, obs: string) {
    setRegistros((prev) => ({ ...prev, [jugadorId]: { ...prev[jugadorId], obs } }));
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    try {
      const data = jugadores.map((j) => ({
        jugadorId:     j.id,
        estado:        registros[j.id]?.estado ?? "ausente",
        observaciones: registros[j.id]?.obs    ?? "",
      }));
      const res = await fetch(`/api/asistencia/${entrenamientoId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ registros: data }),
      });
      if (!res.ok) throw new Error();
      router.push("/entrenamientos");
    } catch {
      setMsg({ ok: false, text: "Error al guardar. Intentá de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  // Conteos en tiempo real
  const presentes  = Object.values(registros).filter((r) => r.estado === "presente").length;
  const tardanzas  = Object.values(registros).filter((r) => r.estado === "tardanza").length;
  const ausentes   = Object.values(registros).filter((r) => r.estado === "ausente" || r.estado === "justificado").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>

      {/* ── Resumen en tiempo real ─────────────────────────────────── */}
      <div style={{
        background: "rgba(17,24,39,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid #1e2d4a", borderRadius: 14,
        padding: "14px 16px",
      }}>
        {/* Titular */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(241,245,249,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Presentes
          </span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#10B981", lineHeight: 1 }}>
            {presentes + tardanzas}
            <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(241,245,249,0.4)", marginLeft: 4 }}>
              de {totalJugadores}
            </span>
          </span>
        </div>
        {/* Chips */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Asisten",   val: presentes, color: "#10B981" },
            { label: "Faltan",    val: ausentes,  color: "#EF4444" },
            { label: "Tardanzas", val: tardanzas,  color: "#F59E0B" },
          ].map((c) => (
            <div key={c.label} style={{
              textAlign: "center", padding: "8px 4px",
              background: `${c.color}12`, borderRadius: 8,
              border: `1px solid ${c.color}30`,
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</p>
              <p style={{ fontSize: 9, color: "rgba(241,245,249,0.4)", marginTop: 3, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lista de jugadores ─────────────────────────────────────── */}
      <div style={{
        background: "rgba(17,24,39,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid #1e2d4a", borderRadius: 14, overflow: "hidden",
      }}>
        {jugadores.map((j, i) => {
          const reg    = registros[j.id] ?? { estado: "ausente" as EstadoAsistencia, obs: "" };
          const estado = reg.estado;

          return (
            <div
              key={j.id}
              style={{
                padding: "12px 14px",
                borderBottom: i < jugadores.length - 1 ? "1px solid #1e2d4a" : "none",
                background: estado === "presente"
                  ? "rgba(16,185,129,0.04)"
                  : estado === "tardanza"
                  ? "rgba(245,158,11,0.04)"
                  : estado === "ausente"
                  ? "rgba(239,68,68,0.03)"
                  : "transparent",
              }}
            >
              {/* Fila: número + nombre */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {/* Número de camiseta */}
                <span style={{
                  width: 28, flexShrink: 0, textAlign: "right",
                  fontSize: 16, fontWeight: 900, color: "#0EA5E9",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {j.numero_camiseta ?? "—"}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: "#f1f5f9",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                  }}>
                    {j.nombre} {j.apellido}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                    padding: "1px 6px", borderRadius: 4, marginTop: 2, display: "inline-block",
                    background: j.fichado ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.08)",
                    color: j.fichado ? "#0EA5E9" : "rgba(241,245,249,0.4)",
                    border: `1px solid ${j.fichado ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                    {j.fichado ? "Fichado" : "No fichado"}
                  </span>
                </span>
              </div>

              {/* Fila: botones ASISTE / FALTA / TARDE */}
              <div style={{ display: "flex", gap: 8, marginLeft: 38 }}>
                {BTNS.map((btn) => {
                  const active = estado === btn.valor;
                  return (
                    <button
                      key={btn.valor}
                      onClick={() => setEstado(j.id, btn.valor)}
                      style={{
                        flex: 1, height: 38, borderRadius: 9,
                        fontSize: 11, fontWeight: 800,
                        letterSpacing: "0.5px", textTransform: "uppercase",
                        border: "none", cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: active ? btn.bg : "rgba(255,255,255,0.06)",
                        color:      active ? btn.text : "rgba(241,245,249,0.3)",
                        boxShadow:  active ? `0 0 14px ${btn.shadow}, 0 2px 6px ${btn.shadow}` : "none",
                        opacity:    active ? 1 : 0.65,
                      }}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>

              {/* Observación (solo si falta o tardanza) */}
              {(estado === "ausente" || estado === "tardanza" || estado === "justificado") && (
                <input
                  type="text"
                  placeholder="Observación (opcional)..."
                  value={reg.obs}
                  onChange={(e) => setObs(j.id, e.target.value)}
                  style={{
                    marginTop: 8, marginLeft: 38,
                    width: "calc(100% - 38px)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #1e2d4a",
                    color: "#f1f5f9", borderRadius: 7, padding: "6px 10px",
                    fontSize: 12, outline: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Guardar ────────────────────────────────────────────────── */}
      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          width: "100%", height: 50, borderRadius: 12,
          background: guardando
            ? "rgba(16,185,129,0.3)"
            : "linear-gradient(135deg, #10B981, #059669)",
          color: "#fff", fontSize: 14, fontWeight: 800,
          letterSpacing: "1px", textTransform: "uppercase",
          border: "none", cursor: guardando ? "not-allowed" : "pointer",
          boxShadow: guardando ? "none" : "0 4px 18px rgba(16,185,129,0.4)",
          transition: "all 0.2s ease",
        }}
      >
        {guardando
          ? "Guardando…"
          : modificaciones === 0
          ? "Guardar asistencia (todos presentes)"
          : `Guardar (${modificaciones} modificación${modificaciones !== 1 ? "es" : ""})`}
      </button>

      {/* Mensaje resultado */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, textAlign: "center",
          background: msg.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${msg.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: msg.ok ? "#10B981" : "#EF4444",
          fontSize: 13, fontWeight: 700,
        }}>
          {msg.ok ? "✓ " : "✕ "}{msg.text}
        </div>
      )}
    </div>
  );
}
