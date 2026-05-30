"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rival { id: number; nombre: string; escudo: string | null }

// Consistent color per club name from a palette
const PALETTE = [
  "#0EA5E9", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6366F1", "#14B8A6", "#E11D48",
];

function clubColor(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

interface Props { rivales: Rival[] }

export default function NuevoPartidoClient({ rivales }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    fecha: "", rivalId: null as number | null, rival: "",
    lugar: "", condicion: "local", campeonato: "Liga Costa de Oro 2026",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function seleccionarRival(r: Rival) {
    setForm((p) => ({ ...p, rivalId: r.id, rival: r.nombre }));
    setError("");
  }

  function onChange(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fecha) { setError("La fecha es obligatoria."); return; }
    if (!form.rivalId) { setError("Seleccioná un rival."); return; }
    setGuardando(true);
    setError("");
    const res = await fetch("/api/partidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError("Error al guardar."); setGuardando(false); return; }
    const { id } = await res.json();
    router.push(`/partidos/${id}/planificacion`);
  }

  return (
    <form onSubmit={submit} className="form-dark space-y-5 max-w-lg">

      {/* Fecha */}
      <div>
        <label>Fecha *</label>
        <input type="datetime-local" value={form.fecha}
          onChange={(e) => onChange("fecha", e.target.value)} />
      </div>

      {/* Selector de rival */}
      <div>
        <label style={{ display: "block", marginBottom: 10 }}>Rival *</label>

        {form.rival && (
          <div style={{
            marginBottom: 12, padding: "8px 12px", borderRadius: 8,
            background: "rgba(14,165,233,0.10)", border: "1px solid rgba(14,165,233,0.35)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: clubColor(form.rival),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
            }}>
              {iniciales(form.rival)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0EA5E9" }}>
              {form.rival}
            </span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, rivalId: null, rival: "" }))}
              style={{
                marginLeft: "auto", background: "none", border: "none",
                color: "rgba(241,245,249,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1,
              }}
            >×</button>
          </div>
        )}

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
        }}>
          {rivales.map((r) => {
            const selected = form.rivalId === r.id;
            const color = clubColor(r.nombre);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => seleccionarRival(r)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: selected ? "rgba(14,165,233,0.14)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selected ? "rgba(14,165,233,0.45)" : "#1e2d4a"}`,
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                {r.escudo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.escudo} alt={r.nombre}
                    style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, color: "#fff",
                    boxShadow: selected ? `0 0 0 2px ${color}55` : "none",
                  }}>
                    {iniciales(r.nombre)}
                  </div>
                )}
                <span style={{
                  fontSize: 12, fontWeight: selected ? 800 : 600, lineHeight: 1.3,
                  color: selected ? "#0EA5E9" : "rgba(241,245,249,0.75)",
                }}>
                  {r.nombre}
                </span>
                {selected && (
                  <span style={{
                    marginLeft: "auto", fontSize: 14, color: "#0EA5E9", flexShrink: 0,
                  }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lugar */}
      <div>
        <label>Lugar</label>
        <input type="text" value={form.lugar} onChange={(e) => onChange("lugar", e.target.value)}
          placeholder="Cancha San Luis de Pando" />
      </div>

      {/* Condición */}
      <div>
        <label>Condición</label>
        <select value={form.condicion} onChange={(e) => onChange("condicion", e.target.value)}>
          <option value="local">Local</option>
          <option value="visitante">Visitante</option>
        </select>
      </div>

      {/* Campeonato */}
      <div>
        <label>Campeonato</label>
        <input type="text" value={form.campeonato} onChange={(e) => onChange("campeonato", e.target.value)}
          placeholder="Liga Costa de Oro 2026" />
      </div>

      {/* Formato */}
      <div style={{
        padding: "10px 14px", borderRadius: 8, fontSize: 11,
        background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)",
        color: "rgba(241,245,249,0.6)", lineHeight: 1.5,
      }}>
        ⏱ <strong style={{ color: "#0EA5E9" }}>50 min</strong> · 2 tiempos de 25 min
        · Planificación en <strong style={{ color: "#0EA5E9" }}>4 cuartos de 12.5 min</strong>
      </div>

      {error && <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>{error}</p>}

      <button type="submit" disabled={guardando} style={{
        width: "100%", height: 46, borderRadius: 10,
        background: guardando ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg, #0EA5E9, #0284c7)",
        color: "#fff", fontSize: 13, fontWeight: 800,
        letterSpacing: "0.5px", textTransform: "uppercase",
        border: "none", cursor: guardando ? "not-allowed" : "pointer",
        boxShadow: guardando ? "none" : "0 4px 16px rgba(14,165,233,0.35)",
      }}>
        {guardando ? "Guardando…" : "Crear partido"}
      </button>
    </form>
  );
}
