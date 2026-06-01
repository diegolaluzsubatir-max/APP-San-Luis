"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LUGARES = ["Cancha San Luis de Pando", "Cancha Cerrada", "Amistoso", "Otro"];
const MOTIVOS_SUSPENSION = ["Lluvia", "Cancha ocupada", "Feriado", "Decisión técnica", "Otro"];
const DURACIONES = [60, 75, 90, 120];

// Times from 08:00 to 21:30 in 30-min steps
const HORAS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function defaultHora(dateStr: string): string {
  if (!dateStr) return "";
  const day = new Date(dateStr + "T12:00:00").getDay(); // avoid TZ shift
  if (day === 2 || day === 4) return "19:00"; // Tue / Thu
  if (day === 6) return "10:00";              // Sat
  return "";
}

export default function NuevoEntrenamientoClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    fecha:       "",
    hora_inicio: "",
    duracion:    90,
    lugar_tipo:  "Cancha San Luis de Pando",
    lugar_otro:  "",
    entrenador:  "Ernesto Fontes",
    objetivo:    "",
    observaciones: "",
    tipo:        "obligatorio",
  });
  const [suspendido,   setSuspendido]   = useState(false);
  const [motivoTipo,   setMotivoTipo]   = useState("Lluvia");
  const [motivoOtro,   setMotivoOtro]   = useState("");
  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState("");

  function setF(k: string, v: string | number) { setForm((p) => ({ ...p, [k]: v })); }

  function onFechaChange(v: string) {
    const hora = defaultHora(v);
    setForm((p) => ({ ...p, fecha: v, hora_inicio: hora || p.hora_inicio }));
  }

  const lugarFinal  = form.lugar_tipo === "Otro" ? form.lugar_otro : form.lugar_tipo;
  const motivoFinal = motivoTipo === "Otro" ? motivoOtro : motivoTipo;
  const horaFin     = form.hora_inicio ? addMinutes(form.hora_inicio, form.duracion) : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fecha)    { setError("La fecha es obligatoria.");             return; }
    if (!form.hora_inicio) { setError("La hora de inicio es obligatoria."); return; }
    setGuardando(true); setError("");

    const res = await fetch("/api/entrenamientos", {
      method:  "POST",
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
      setError(msg);
      setGuardando(false);
      return;
    }
    router.refresh();
router.push("/entrenamientos");
  }

  return (
    <form onSubmit={submit} className="form-dark space-y-4 max-w-lg">

      {/* Fecha */}
      <div>
        <label>Fecha *</label>
        <input type="date" value={form.fecha} onChange={(e) => onFechaChange(e.target.value)} />
      </div>

      {/* Hora inicio + duración */}
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

      {/* Hora fin calculada */}
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
            placeholder="Especificar lugar..."
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      {/* Entrenador */}
      <div>
        <label>Entrenador responsable</label>
        <input type="text" value={form.entrenador} onChange={(e) => setF("entrenador", e.target.value)} />
      </div>

      {/* Objetivo */}
      <div>
        <label>Objetivo del entrenamiento</label>
        <input type="text" value={form.objetivo} onChange={(e) => setF("objetivo", e.target.value)}
          placeholder="Ej: Trabajo técnico — conducción y control" />
      </div>

      {/* Observaciones */}
      <div>
        <label>Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={(e) => setF("observaciones", e.target.value)}
          rows={3}
          placeholder="Observaciones del entrenamiento..."
        />
      </div>

      {/* Práctica suspendida — temporalmente oculto */}

      {error && <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>{error}</p>}

      <button type="submit" disabled={guardando} style={{
        width: "100%", height: 46, borderRadius: 10,
        background: guardando ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10B981,#059669)",
        color: "#fff", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.5px", textTransform: "uppercase",
        border: "none", cursor: guardando ? "not-allowed" : "pointer",
        boxShadow: guardando ? "none" : "0 4px 16px rgba(16,185,129,0.35)",
      }}>
        {guardando ? "Guardando…" : "Crear entrenamiento"}
      </button>

      {(lugarFinal || form.objetivo) && (
        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 11, color: "rgba(241,245,249,0.5)" }}>
          📍 {lugarFinal || "—"} · {form.hora_inicio || "—"}{horaFin ? `–${horaFin}` : ""} ({form.duracion} min)
          {form.objetivo ? ` · ${form.objetivo}` : ""}
        </div>
      )}
    </form>
  );
}
