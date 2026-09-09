"use client";

import { useState } from "react";
import { fmtFecha } from "@/lib/utils";
import { DarkBtn, DarkInput, DarkSelect, Badge } from "@/components/JugadorForm";
import { ETIQUETAS, ETIQUETA_COLOR, type CharlaRow } from "@/lib/charlas-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoyISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// La fecha se guarda a mediodía local; para el input date alcanza con YYYY-MM-DD
// expresado en zona Montevideo (la misma que usa fmtFecha).
function isoToInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

type Draft = { fecha: string; etiqueta: string; temas: string[] };

function draftFrom(c?: CharlaRow): Draft {
  return c
    ? { fecha: isoToInput(c.fecha), etiqueta: c.etiqueta ?? "", temas: [...c.temas] }
    : { fecha: hoyISO(), etiqueta: "", temas: [] };
}

function ordenar(list: CharlaRow[]) {
  return [...list].sort((a, b) =>
    a.fecha === b.fecha ? b.id - a.id : (a.fecha < b.fecha ? 1 : -1)
  );
}

const LABEL: React.CSSProperties = {
  fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CharlasTab({
  jugadorId,
  charlas,
  onChange,
}: {
  jugadorId: number
  charlas: CharlaRow[]
  onChange: (next: CharlaRow[]) => void
}) {
  const [creando, setCreando]     = useState(false)
  const [editandoId, setEditando] = useState<number | null>(null)
  const [abiertas, setAbiertas]   = useState<Set<number>>(new Set())
  const [error, setError]         = useState<string | null>(null)

  function toggle(id: number) {
    setAbiertas(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  async function crear(d: Draft) {
    const res = await fetch("/api/charlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId, fecha: d.fecha, etiqueta: d.etiqueta || null, temas: d.temas }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`)
    const nueva = json as CharlaRow
    onChange(ordenar([nueva, ...charlas]))
    setAbiertas(prev => new Set(prev).add(nueva.id))
    setCreando(false)
  }

  async function editar(id: number, d: Draft) {
    const res = await fetch(`/api/charlas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: d.fecha, etiqueta: d.etiqueta || null, temas: d.temas }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`)
    onChange(ordenar(charlas.map(c => (c.id === id ? (json as CharlaRow) : c))))
    setEditando(null)
  }

  async function borrar(id: number) {
    const res = await fetch(`/api/charlas/${id}`, { method: "DELETE" })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`)
    onChange(charlas.filter(c => c.id !== id))
  }

  // Envuelve una acción async y muestra el error en la barra superior
  function conError(fn: () => Promise<void>) {
    return async () => {
      setError(null)
      try { await fn() } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 12 }}>Error:</span>
          <span style={{ color: "rgba(241,245,249,0.8)", fontSize: 12, flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Barra superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {charlas.length === 0 ? "Sin charlas registradas" : `${charlas.length} ${charlas.length === 1 ? "charla" : "charlas"}`}
        </p>
        {!creando && (
          <DarkBtn onClick={() => { setCreando(true); setEditando(null); setError(null) }} color="#0EA5E9">
            + Nueva charla
          </DarkBtn>
        )}
      </div>

      {/* Formulario de alta */}
      {creando && (
        <CharlaForm
          initial={draftFrom()}
          titulo="Nueva charla"
          onCancel={() => setCreando(false)}
          onSave={d => conError(() => crear(d))()}
        />
      )}

      {/* Lista (ya viene ordenada de más reciente a más vieja) */}
      {charlas.map(c =>
        editandoId === c.id ? (
          <CharlaForm
            key={c.id}
            initial={draftFrom(c)}
            titulo="Editar charla"
            onCancel={() => setEditando(null)}
            onSave={d => conError(() => editar(c.id, d))()}
          />
        ) : (
          <CharlaCard
            key={c.id}
            charla={c}
            abierta={abiertas.has(c.id)}
            onToggle={() => toggle(c.id)}
            onEdit={() => { setEditando(c.id); setCreando(false); setError(null) }}
            onDelete={conError(() => borrar(c.id))}
          />
        )
      )}

      {charlas.length === 0 && !creando && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "32px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Todavía no hay charlas con este jugador</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            Registrá acá las conversaciones individuales y los temas hablados.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Card (colapsada / expandida) ─────────────────────────────────────────────

function CharlaCard({
  charla: c, abierta, onToggle, onEdit, onDelete,
}: {
  charla: CharlaRow
  abierta: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando]       = useState(false)
  const color = c.etiqueta ? (ETIQUETA_COLOR[c.etiqueta] ?? "rgba(241,245,249,0.45)") : null

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden",
    }}>
      {/* Cabecera clickeable */}
      <button type="button" onClick={onToggle} style={{
        width: "100%", background: "transparent", border: "none", cursor: "pointer",
        padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
      }}>
        <span style={{
          fontSize: 11, color: "#0EA5E9", transform: abierta ? "rotate(90deg)" : "none",
          transition: "transform 0.15s ease", display: "inline-block", width: 12, flexShrink: 0,
        }}>▶</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>
            {fmtFecha(c.fecha)}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {c.temas.length} {c.temas.length === 1 ? "tema" : "temas"}
          </p>
        </div>
        {color && c.etiqueta && <Badge color={color}>{c.etiqueta}</Badge>}
      </button>

      {abierta && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px" }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {c.temas.map((t, i) => (
              <li key={i} style={{
                display: "flex", gap: 8, fontSize: 12, color: "var(--text-secondary)",
                padding: "6px 0", borderBottom: i < c.temas.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{ color: "#0EA5E9", flexShrink: 0 }}>•</span>
                <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{t}</span>
              </li>
            ))}
          </ul>

          {/* Acciones */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            {confirmando ? (
              <>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>¿Borrar esta charla?</span>
                <DarkBtn onClick={() => setConfirmando(false)} color="rgba(241,245,249,0.45)" disabled={borrando}>No</DarkBtn>
                <DarkBtn
                  onClick={async () => { setBorrando(true); try { await onDelete() } finally { setBorrando(false); setConfirmando(false) } }}
                  color="#EF4444" disabled={borrando}>
                  {borrando ? "Borrando…" : "Sí, borrar"}
                </DarkBtn>
              </>
            ) : (
              <>
                <DarkBtn onClick={() => setConfirmando(true)} color="#EF4444">Borrar</DarkBtn>
                <DarkBtn onClick={onEdit} color="#0EA5E9">Editar</DarkBtn>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formulario (alta y edición) ──────────────────────────────────────────────

function CharlaForm({
  initial, titulo, onCancel, onSave,
}: {
  initial: Draft
  titulo: string
  onCancel: () => void
  onSave: (d: Draft) => Promise<void>
}) {
  const [d, setD]           = useState<Draft>(initial)
  const [nuevo, setNuevo]   = useState("")
  const [saving, setSaving] = useState(false)

  function agregarTema() {
    const t = nuevo.trim()
    if (!t) return
    setD(prev => ({ ...prev, temas: [...prev.temas, t] }))
    setNuevo("")
  }

  function quitarTema(i: number) {
    setD(prev => ({ ...prev, temas: prev.temas.filter((_, k) => k !== i) }))
  }

  const puedeGuardar = d.fecha.length === 10 && d.temas.length > 0 && !saving

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid rgba(14,165,233,0.45)", borderRadius: 12,
      padding: "14px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#0EA5E9", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {titulo}
      </p>

      {/* Fecha + etiqueta */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={LABEL}>Fecha</label>
          <DarkInput type="date" value={d.fecha} onChange={v => setD(prev => ({ ...prev, fecha: v }))} />
        </div>
        <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={LABEL}>Etiqueta (opcional)</label>
          <DarkSelect value={d.etiqueta} onChange={v => setD(prev => ({ ...prev, etiqueta: v }))}>
            <option value="">Sin etiqueta</option>
            {ETIQUETAS.map(e => <option key={e} value={e}>{e}</option>)}
          </DarkSelect>
        </div>
      </div>

      {/* Temas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={LABEL}>Temas hablados</label>
        {d.temas.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {d.temas.map((t, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "var(--bg-card-2)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "8px 10px", fontSize: 12, color: "var(--text-secondary)",
              }}>
                <span style={{ color: "#0EA5E9", flexShrink: 0 }}>•</span>
                <span style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{t}</span>
                <button type="button" onClick={() => quitarTema(i)} aria-label="Quitar tema" style={{
                  background: "transparent", border: "none", color: "#EF4444", cursor: "pointer",
                  fontSize: 14, lineHeight: 1, padding: "0 2px", flexShrink: 0,
                }}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={nuevo}
            onChange={e => setNuevo(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregarTema() } }}
            placeholder="Escribí un tema y agregalo"
            style={{
              flex: 1, minWidth: 0, background: "var(--bg-card-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "9px 10px", fontSize: 13, color: "#f1f5f9", outline: "none",
            }}
          />
          <DarkBtn onClick={agregarTema} color="#0EA5E9" disabled={!nuevo.trim()}>Agregar</DarkBtn>
        </div>
        {d.temas.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Agregá al menos un tema para poder guardar.</p>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <DarkBtn onClick={onCancel} color="rgba(241,245,249,0.45)" disabled={saving}>Cancelar</DarkBtn>
        <DarkBtn
          onClick={async () => { setSaving(true); try { await onSave(d) } finally { setSaving(false) } }}
          color="#10B981" disabled={!puedeGuardar}>
          {saving ? "Guardando…" : "Guardar"}
        </DarkBtn>
      </div>
    </div>
  )
}
