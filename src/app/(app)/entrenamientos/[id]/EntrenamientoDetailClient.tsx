"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Constants (shared with NuevoEntrenamientoClient) ──────────────────────────
const LUGARES = ["Cancha San Luis de Pando", "Cancha Cerrada", "Amistoso", "Otro"];
const MOTIVOS = ["Lluvia", "Cancha ocupada", "Feriado", "Decisión técnica", "Otro"];
const DURACIONES = [60, 75, 90, 120];
const HORAS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function diffMinutes(inicio: string, fin: string): number {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return DURACIONES.includes(diff) ? diff : 90;
}

function isoToDateInput(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    year: "numeric", month: "2-digit", day: "2-digit",
    timeZone: "America/Montevideo",
  }).split("/").reverse().join("-"); // dd/mm/yyyy → yyyy-mm-dd
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Montevideo",
  }).replace(/^\w/, (c) => c.toUpperCase());
}

function inferLugarTipo(lugar: string): string {
  return LUGARES.slice(0, 3).includes(lugar) ? lugar : "Otro";
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entrenamiento {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  entrenador: string;
  objetivo: string | null;
  observaciones: string | null;
  suspendido: boolean;
  motivo_suspension: string | null;
  estado: string;
  asistencias: { estado: string }[];
}

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: on ? "#EF4444" : "rgba(255,255,255,0.15)",
        position: "relative", flexShrink: 0, transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EntrenamientoDetailClient({ entrenamiento }: { entrenamiento: Entrenamiento }) {
  const router = useRouter();

  // ── Edit modal state ───────────────────────────────────────────────────────
  const lugarTipoInicial = inferLugarTipo(entrenamiento.lugar);
  const [editOpen,    setEditOpen]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [guardando,   setGuardando]   = useState(false);
  const [eliminando,  setEliminando]  = useState(false);
  const [error,       setError]       = useState("");

  const [form, setForm] = useState({
    fecha:        isoToDateInput(entrenamiento.fecha),
    hora_inicio:  entrenamiento.hora_inicio,
    duracion:     diffMinutes(entrenamiento.hora_inicio, entrenamiento.hora_fin),
    lugar_tipo:   lugarTipoInicial,
    lugar_otro:   lugarTipoInicial === "Otro" ? entrenamiento.lugar : "",
    entrenador:   entrenamiento.entrenador,
    objetivo:     entrenamiento.objetivo ?? "",
    observaciones: entrenamiento.observaciones ?? "",
  });
  const [suspendido,  setSuspendido]  = useState(entrenamiento.suspendido);
  const [motivoTipo,  setMotivoTipo]  = useState(() => {
    const m = entrenamiento.motivo_suspension ?? "";
    return MOTIVOS.slice(0, 4).includes(m) ? m : (m ? "Otro" : "Lluvia");
  });
  const [motivoOtro,  setMotivoOtro]  = useState(() => {
    const m = entrenamiento.motivo_suspension ?? "";
    return MOTIVOS.slice(0, 4).includes(m) ? "" : m;
  });

  function setF(k: string, v: string | number) { setForm((p) => ({ ...p, [k]: v })); }

  const lugarFinal  = form.lugar_tipo === "Otro" ? form.lugar_otro : form.lugar_tipo;
  const motivoFinal = motivoTipo === "Otro" ? motivoOtro : motivoTipo;
  const horaFin     = form.hora_inicio ? addMinutes(form.hora_inicio, form.duracion) : "";

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total   = entrenamiento.asistencias.length;
  const present = entrenamiento.asistencias.filter(
    (a) => a.estado === "presente" || a.estado === "tardanza"
  ).length;
  const pct = total > 0 ? Math.round((present / total) * 100) : null;

  // ── Guardar cambios ────────────────────────────────────────────────────────
  async function guardar() {
    if (!form.fecha)       { setError("La fecha es obligatoria.");       return; }
    if (!form.hora_inicio) { setError("La hora de inicio es obligatoria."); return; }
    if (suspendido && !motivoFinal) { setError("Indicá el motivo de suspensión."); return; }
    setGuardando(true); setError("");

    const res = await fetch(`/api/entrenamientos/${entrenamiento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha:         form.fecha,
        hora_inicio:   form.hora_inicio,
        hora_fin:      horaFin,
        lugar:         lugarFinal || "Cancha San Luis de Pando",
        entrenador:    form.entrenador,
        objetivo:      form.objetivo,
        observaciones: form.observaciones,
      }),
    });

    if (!res.ok) {
      let msg = "Error al guardar.";
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
      setError(msg); setGuardando(false); return;
    }
    setEditOpen(false);
    router.refresh();
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function eliminar() {
    setEliminando(true);
    const res = await fetch(`/api/entrenamientos/${entrenamiento.id}`, { method: "DELETE" });
    if (!res.ok) {
      setEliminando(false); setConfirmDel(false);
      alert("Error al eliminar el entrenamiento.");
      return;
    }
    router.push("/entrenamientos");
  }

  // ── Badge ──────────────────────────────────────────────────────────────────
  const badge = entrenamiento.suspendido
    ? { label: "SUSPENDIDA", bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "rgba(239,68,68,0.3)" }
    : entrenamiento.estado === "realizado"
    ? { label: "REALIZADO",  bg: "rgba(16,185,129,0.10)", color: "#10B981", border: "rgba(16,185,129,0.25)" }
    : { label: "PLANIFICADO",bg: "rgba(14,165,233,0.08)", color: "#0EA5E9", border: "rgba(14,165,233,0.2)" };

  return (
    <>
      {/* ── Detalle ─────────────────────────────────────────────────── */}
      <div className="max-w-xl space-y-4">

        {/* Volver */}
        <Link href="/entrenamientos" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 600, color: "#0EA5E9",
          textDecoration: "none",
        }}>
          ← Entrenamientos
        </Link>

        {/* Header card */}
        <div style={{
          background: "rgba(17,24,39,0.90)", backdropFilter: "blur(10px)",
          border: "1px solid #1e2d4a", borderRadius: 14, padding: "16px",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,#0EA5E9,#10B981)", borderRadius: 1, marginBottom: 14 }} />

          {/* Top row: fecha + botón editar */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.3 }}>
                {fmtFecha(entrenamiento.fecha)}
              </p>
              <p style={{ fontSize: 13, color: "rgba(241,245,249,0.55)", marginTop: 4 }}>
                {entrenamiento.hora_inicio} – {entrenamiento.hora_fin} · {entrenamiento.lugar}
              </p>
            </div>
            <button
              onClick={() => { setEditOpen(true); setError(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(14,165,233,0.4)",
                background: "rgba(14,165,233,0.1)", color: "#0EA5E9",
                fontSize: 12, fontWeight: 800, letterSpacing: "0.05em",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </button>
          </div>

          {/* Badge + entrenador */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 800,
              letterSpacing: "0.07em", textTransform: "uppercase",
              background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
            }}>
              {badge.label}
            </span>
            <span style={{ fontSize: 11, color: "rgba(241,245,249,0.4)" }}>
              👤 {entrenamiento.entrenador}
            </span>
          </div>

          {/* Suspendida */}
          {entrenamiento.suspendido && entrenamiento.motivo_suspension && (
            <div style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <p style={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}>
                ⚠️ Práctica suspendida — {entrenamiento.motivo_suspension}
              </p>
            </div>
          )}

          {/* Objetivo */}
          {entrenamiento.objetivo && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,245,249,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Objetivo
              </p>
              <p style={{ fontSize: 13, color: "#f1f5f9" }}>{entrenamiento.objetivo}</p>
            </div>
          )}

          {/* Observaciones */}
          {entrenamiento.observaciones && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,245,249,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Observaciones
              </p>
              <p style={{ fontSize: 13, color: "rgba(241,245,249,0.7)" }}>{entrenamiento.observaciones}</p>
            </div>
          )}
        </div>

        {/* Asistencia stats + link */}
        <div style={{
          background: "rgba(17,24,39,0.90)", border: "1px solid #1e2d4a",
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,245,249,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Asistencia
            </p>
            {pct !== null ? (
              <p style={{ fontSize: 22, fontWeight: 900, color: pct >= 85 ? "#10B981" : pct >= 70 ? "#F59E0B" : "#EF4444" }}>
                {pct}% <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(241,245,249,0.4)" }}>{present}/{total} jugadores</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "rgba(241,245,249,0.35)" }}>Sin registrar</p>
            )}
          </div>
          <Link
            href={`/asistencia/${entrenamiento.id}`}
            style={{
              padding: "8px 16px", borderRadius: 8, textDecoration: "none",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              color: "#10B981", fontSize: 12, fontWeight: 800,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}
          >
            Registrar
          </Link>
        </div>
      </div>

      {/* ── Modal de edición ────────────────────────────────────────── */}
      {editOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            overflowY: "auto",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div style={{
            background: "rgba(17,24,39,0.98)", border: "1px solid #1e2d4a",
            borderRadius: 20, margin: "24px auto", padding: 20,
            maxWidth: 520, width: "calc(100% - 32px)",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#f1f5f9", fontFamily: "'Montserrat',sans-serif", letterSpacing: "0.05em" }}>
                EDITAR ENTRENAMIENTO
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                style={{ background: "transparent", border: "none", color: "rgba(241,245,249,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="form-dark space-y-4">

              {/* Fecha */}
              <div>
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={(e) => setF("fecha", e.target.value)} />
              </div>

              {/* Hora + duración */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label>Hora de inicio</label>
                  <select value={form.hora_inicio} onChange={(e) => setF("hora_inicio", e.target.value)}>
                    <option value="">— seleccionar —</option>
                    {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label>Duración</label>
                  <select value={form.duracion} onChange={(e) => setF("duracion", parseInt(e.target.value))}>
                    {DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>

              {horaFin && (
                <p style={{ fontSize: 12, color: "rgba(241,245,249,0.5)", marginTop: -8 }}>
                  Finaliza a las <strong style={{ color: "#0EA5E9" }}>{horaFin}</strong>
                </p>
              )}

              {/* Lugar */}
              <div>
                <label>Lugar / Cancha</label>
                <select value={form.lugar_tipo} onChange={(e) => setF("lugar_tipo", e.target.value)}>
                  {LUGARES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {form.lugar_tipo === "Otro" && (
                  <input
                    type="text" value={form.lugar_otro}
                    onChange={(e) => setF("lugar_otro", e.target.value)}
                    placeholder="Especificar lugar..." style={{ marginTop: 8 }}
                  />
                )}
              </div>

              {/* Entrenador */}
              <div>
                <label>Entrenador</label>
                <input type="text" value={form.entrenador} onChange={(e) => setF("entrenador", e.target.value)} />
              </div>

              {/* Objetivo */}
              <div>
                <label>Objetivo</label>
                <input type="text" value={form.objetivo} onChange={(e) => setF("objetivo", e.target.value)}
                  placeholder="Ej: Trabajo técnico" />
              </div>

              {/* Observaciones */}
              <div>
                <label>Observaciones</label>
                <textarea value={form.observaciones} rows={3}
                  onChange={(e) => setF("observaciones", e.target.value)}
                  placeholder="Observaciones..." />
              </div>

              {/* Práctica suspendida — temporalmente oculto */}

              {error && <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>{error}</p>}

              {/* Guardar */}
              <button
                onClick={guardar}
                disabled={guardando}
                style={{
                  width: "100%", height: 46, borderRadius: 10, border: "none",
                  background: guardando ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg,#0EA5E9,#0284c7)",
                  color: "#fff", fontSize: 13, fontWeight: 800,
                  letterSpacing: "0.5px", textTransform: "uppercase",
                  cursor: guardando ? "not-allowed" : "pointer",
                  boxShadow: guardando ? "none" : "0 4px 16px rgba(14,165,233,0.35)",
                }}
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>

              {/* Separador */}
              <div style={{ height: 1, background: "#1e2d4a", margin: "4px 0" }} />

              {/* Eliminar */}
              {!confirmDel ? (
                <button
                  onClick={() => setConfirmDel(true)}
                  style={{
                    width: "100%", height: 44, borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    color: "#EF4444", fontSize: 12, fontWeight: 800,
                    letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  🗑 Eliminar entrenamiento
                </button>
              ) : (
                <div style={{
                  background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 10, padding: "14px 16px",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", marginBottom: 12, textAlign: "center" }}>
                    ¿Estás seguro? Esta acción no se puede deshacer.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setConfirmDel(false)}
                      style={{
                        flex: 1, height: 40, borderRadius: 8,
                        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(241,245,249,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={eliminar}
                      disabled={eliminando}
                      style={{
                        flex: 1, height: 40, borderRadius: 8, border: "none",
                        background: eliminando ? "rgba(239,68,68,0.4)" : "#EF4444",
                        color: "#fff", fontSize: 12, fontWeight: 800,
                        cursor: eliminando ? "not-allowed" : "pointer",
                      }}
                    >
                      {eliminando ? "Eliminando…" : "Sí, eliminar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
