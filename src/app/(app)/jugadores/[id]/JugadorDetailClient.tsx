"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { fmtFecha, estadoDocumento } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JugadorEditable = {
  id: number
  nombre: string
  apellido: string
  numero_camiseta: number | null
  posicion: string | null
  pierna_habil: string | null
  estado: string
  fichado: boolean
  cedula: string | null
  fecha_nacimiento: string | null
  direccion: string | null
  madre_nombre: string | null
  madre_telefono: string | null
  padre_nombre: string | null
  padre_telefono: string | null
  tutor_nombre: string | null
  tutor_telefono: string | null
  tutor_relacion: string | null
  contacto_email: string | null
  mutualista: string | null
  alergias: string | null
  medicacion: string | null
  obs_medicas: string | null
  obs_generales: string | null
  ci_vencimiento: string | null
  ficha_medica_vence: string | null
  autorizacion: boolean
  foto_url: string | null
}

export type Stats = {
  partidos: number
  goles: number
  asistencias: number
  minutos: number
  pctMes: number | null
  pctAnual: number | null
  meses: Record<string, { total: number; presentes: number }>
  ultimaEval: Record<string, number | string | null> | null
  ultimaEvalFecha: string | null
}

type EvalKey = "conducta"|"compromiso"|"respeto"|"companerismo"|"control_balon"|"pase"|"recepcion"|"definicion"|"comprension_tactica"|"velocidad"|"coordinacion"
const EVAL_LABELS: [EvalKey, string, string][] = [
  ["conducta","Conducta","Actitud"],
  ["compromiso","Compromiso","Actitud"],
  ["respeto","Respeto","Actitud"],
  ["companerismo","Compañerismo","Actitud"],
  ["control_balon","Control de balón","Técnica"],
  ["pase","Pase","Técnica"],
  ["recepcion","Recepción","Técnica"],
  ["definicion","Definición","Técnica"],
  ["comprension_tactica","Comprensión táctica","Táctica"],
  ["velocidad","Velocidad","Físico"],
  ["coordinacion","Coordinación","Físico"],
]

const posAbrev = (pos: string | null) => {
  if (!pos) return "—";
  const p = pos.toLowerCase();
  if (p.includes("arquero"))   return "ARQ";
  if (p.includes("defensa"))   return "DEF";
  if (p.includes("medio"))     return "MED";
  if (p.includes("delantero")) return "DEL";
  return pos.substring(0, 3).toUpperCase();
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function JugadorDetailClient({
  jugador: initial,
  stats,
}: {
  jugador: JugadorEditable
  stats: Stats
}) {
  const [jugador, setJugador] = useState(initial)
  const [tab, setTab]         = useState<"info" | "stats" | "evolucion">("info")
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState<JugadorEditable>(initial)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [fotoFile, setFotoFile]       = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoTs, setFotoTs]           = useState(0)
  const fotoRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setForm({ ...jugador })
    setFotoFile(null)
    setFotoPreview(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setFotoFile(null)
    setFotoPreview(null)
  }

  function setF<K extends keyof JugadorEditable>(k: K, v: JugadorEditable[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function guardar() {
    setSaving(true)
    setError(null)
    try {
      let fotoUrl = form.foto_url
      if (fotoFile) {
        const fd = new FormData()
        fd.append("foto", fotoFile)
        const fotoRes = await fetch(`/api/jugadores/${jugador.id}/foto`, { method: "POST", body: fd })
        if (fotoRes.ok) {
          const r = await fotoRes.json()
          fotoUrl = r.url
        }
      }
      const res = await fetch(`/api/jugadores/${jugador.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, foto_url: fotoUrl }),
      })
      const json = await res.json()
      if (res.ok) {
        setJugador(json)
        setEditing(false)
        setFotoFile(null)
        setFotoPreview(null)
        setFotoTs(Date.now())
        setToast(true)
        setTimeout(() => setToast(false), 3000)
      } else {
        setError(json?.error ?? `Error ${res.status}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const j = jugador
  const fotoSrc = fotoPreview ?? (j.foto_url ? `${j.foto_url}?t=${fotoTs}` : null)
  const estCI  = estadoDocumento(j.ci_vencimiento)
  const estMed = estadoDocumento(j.ficha_medica_vence)

  const docColor = (est: string) => {
    if (est === "vencido")    return "#EF4444";
    if (est === "por-vencer") return "#F59E0B";
    if (est === "vigente")    return "#10B981";
    return "var(--text-muted)";
  };
  const docLabel = (est: string) => {
    if (est === "vencido")    return "Vencido";
    if (est === "por-vencer") return "Por vencer";
    if (est === "vigente")    return "Vigente";
    return "Sin fecha";
  };

  return (
    <div className="max-w-xl space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          style={{ background: "#10B981", color: "#fff" }}>
          ✓ Guardado correctamente
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 10, padding: "12px 14px",
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 12 }}>Error:</span>
          <span style={{ color: "rgba(241,245,249,0.8)", fontSize: 12, flex: 1, wordBreak: "break-all" }}>{error}</span>
          <button onClick={() => setError(null)} style={{
            background: "transparent", border: "none", color: "#EF4444",
            cursor: "pointer", fontSize: 14, flexShrink: 0,
          }}>✕</button>
        </div>
      )}

      {/* Header card */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden",
      }}>
        {/* Player info */}
        <div style={{ padding: "20px 16px 0", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              background: "rgba(14,165,233,0.15)",
              border: "3px solid rgba(14,165,233,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 900, color: "#0EA5E9",
            }}>
              {fotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoSrc} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ position: "relative", width: 52, height: 52, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Escudo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  <div style={{
                    position: "absolute", top: 0, left: "-100%",
                    width: "55%", height: "100%",
                    background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
                    animation: "shineFifa 3.5s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                </div>
              )}
            </div>
            {editing && (
              <>
                <button type="button" onClick={() => fotoRef.current?.click()}
                  style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#0EA5E9", border: "2px solid #111827",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 11,
                  }}>
                  📷
                </button>
                <input ref={fotoRef} type="file" accept="image/jpeg,image/png"
                  className="hidden" onChange={handleFotoChange} />
              </>
            )}
          </div>

          {/* Name / badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div className="space-y-2">
                <div style={{ display: "flex", gap: 8 }}>
                  <DarkInput value={form.nombre} onChange={v => setF("nombre", v)} placeholder="Nombre" />
                  <DarkInput value={form.apellido} onChange={v => setF("apellido", v)} placeholder="Apellido" />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <DarkInput value={form.numero_camiseta?.toString() ?? ""} type="number" placeholder="#"
                    style={{ width: 64 }}
                    onChange={(v: string) => setF("numero_camiseta", v === "" ? null : parseInt(v))} />
                  <DarkSelect value={form.posicion ?? ""} onChange={v => setF("posicion", v || null)}>
                    <option value="">Posición</option>
                    <option>Arquero</option>
                    <option>Defensa</option>
                    <option>Mediocampista</option>
                    <option>Delantero</option>
                  </DarkSelect>
                  <DarkSelect value={form.pierna_habil ?? ""} onChange={v => setF("pierna_habil", v || null)}>
                    <option value="">Pierna</option>
                    <option>Derecha</option>
                    <option>Izquierda</option>
                    <option>Ambas</option>
                  </DarkSelect>
                  <DarkSelect value={form.estado} onChange={v => setF("estado", v)}>
                    <option value="activo">Activo</option>
                    <option value="lesionado">Lesionado</option>
                    <option value="inactivo">Inactivo</option>
                  </DarkSelect>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Fichado:</span>
                  <Toggle value={form.fichado} onChange={v => setF("fichado", v)} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.fichado ? "Sí" : "No"}</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {j.numero_camiseta !== null && (
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#0EA5E9", lineHeight: 1 }}>
                      #{j.numero_camiseta}
                    </span>
                  )}
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>
                      {j.nombre} {j.apellido}
                    </p>
                    <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                      <Badge color={j.fichado ? "#10B981" : "rgba(241,245,249,0.4)"}>
                        {j.fichado ? "Fichado" : "Entrena"}
                      </Badge>
                      {j.posicion && <Badge color="#0EA5E9">{posAbrev(j.posicion)}</Badge>}
                      {j.pierna_habil && <Badge color="rgba(241,245,249,0.4)">{j.pierna_habil[0]}D</Badge>}
                      {j.estado !== "activo" && (
                        <Badge color={j.estado === "lesionado" ? "#F59E0B" : "#EF4444"}>
                          {j.estado}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 16 }}>
          {(["info", "stats", "evolucion"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); if (editing) cancelEdit(); }}
              style={{
                flex: 1, padding: "12px 4px",
                background: "transparent", border: "none",
                borderBottom: `2px solid ${tab === t ? "#0EA5E9" : "transparent"}`,
                color: tab === t ? "#0EA5E9" : "var(--text-muted)",
                fontSize: 11, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >
              {t === "info" ? "Información" : t === "stats" ? "Estadísticas" : "Evolución"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Información ───────────────────────────────────────────────── */}
      {tab === "info" && (
        <div className="space-y-3">
          {/* Edit/save buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {!editing ? (
              <DarkBtn onClick={startEdit} color="#0EA5E9">Editar</DarkBtn>
            ) : (
              <>
                <DarkBtn onClick={cancelEdit} color="rgba(241,245,249,0.45)">Cancelar</DarkBtn>
                <DarkBtn onClick={guardar} color="#10B981" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </DarkBtn>
              </>
            )}
          </div>

          {/* Datos personales */}
          <DarkSection title="Datos personales">
            {editing ? (<>
              <EF label="CI" value={form.cedula ?? ""} onChange={v => setF("cedula", v || null)} />
              <EF label="Nacimiento" type="date" value={form.fecha_nacimiento?.substring(0,10) ?? ""} onChange={v => setF("fecha_nacimiento", v || null)} />
              <EF label="Dirección" value={form.direccion ?? ""} onChange={v => setF("direccion", v || null)} />
            </>) : (<>
              <DF label="CI" value={j.cedula ?? "—"} />
              <DF label="Nacimiento" value={fmtFecha(j.fecha_nacimiento)} />
              <DF label="Dirección" value={j.direccion ?? "—"} />
            </>)}
          </DarkSection>

          {/* Contacto familiar */}
          <DarkSection title="Contacto familiar">
            {editing ? (<>
              <EF label="Nombre madre"  value={form.madre_nombre ?? ""}    onChange={v => setF("madre_nombre", v || null)} />
              <EF label="Tel. madre"    value={form.madre_telefono ?? ""}  onChange={v => setF("madre_telefono", v || null)} />
              <EF label="Nombre padre"  value={form.padre_nombre ?? ""}    onChange={v => setF("padre_nombre", v || null)} />
              <EF label="Tel. padre"    value={form.padre_telefono ?? ""}  onChange={v => setF("padre_telefono", v || null)} />
              <EF label="Nombre tutor"  value={form.tutor_nombre ?? ""}    onChange={v => setF("tutor_nombre", v || null)} />
              <EF label="Tel. tutor"    value={form.tutor_telefono ?? ""}  onChange={v => setF("tutor_telefono", v || null)} />
              <EF label="Relación"      value={form.tutor_relacion ?? ""}  onChange={v => setF("tutor_relacion", v || null)} />
              <EF label="Email"         value={form.contacto_email ?? ""}  onChange={v => setF("contacto_email", v || null)} />
            </>) : (<>
              <DF label="Madre"     value={j.madre_nombre ?? "—"} />
              <DF label="Tel madre" value={j.madre_telefono ?? "—"} />
              <DF label="Padre"     value={j.padre_nombre ?? "—"} />
              <DF label="Tel padre" value={j.padre_telefono ?? "—"} />
              {(j.tutor_nombre || j.tutor_telefono) && (<>
                <DF label="Tutor"     value={j.tutor_nombre ?? "—"} />
                <DF label="Tel tutor" value={j.tutor_telefono ?? "—"} />
                {j.tutor_relacion && <DF label="Relación" value={j.tutor_relacion} />}
              </>)}
              {j.contacto_email && <DF label="Email" value={j.contacto_email} />}
            </>)}
          </DarkSection>

          {/* Datos médicos */}
          <DarkSection title="Datos médicos">
            {editing ? (<>
              <EF label="Mutualista" value={form.mutualista ?? ""} onChange={v => setF("mutualista", v || null)} />
              <EF label="Alergias"   value={form.alergias ?? ""}   onChange={v => setF("alergias", v || null)} />
              <EF label="Medicación" value={form.medicacion ?? ""} onChange={v => setF("medicacion", v || null)} />
              <div style={{ paddingTop: 6 }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Obs. médicas</p>
                <textarea value={form.obs_medicas ?? ""} onChange={e => setF("obs_medicas", e.target.value || null)} rows={2}
                  style={{ width: "100%", background: "var(--bg-card-2)", border: "1px solid var(--border)", color: "#f1f5f9", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none" }} />
              </div>
            </>) : (<>
              <DF label="Mutualista" value={j.mutualista ?? "—"} />
              <DF label="Alergias"   value={j.alergias ?? "—"} />
              <DF label="Medicación" value={j.medicacion ?? "—"} />
              {j.obs_medicas && <DF label="Observaciones" value={j.obs_medicas} />}
            </>)}
          </DarkSection>

          {/* Documentación */}
          <DarkSection title="Documentación">
            {editing ? (<>
              <EF label="Venc. CI"         type="date" value={form.ci_vencimiento?.substring(0,10) ?? ""}       onChange={v => setF("ci_vencimiento", v || null)} />
              <EF label="Venc. ficha méd." type="date" value={form.ficha_medica_vence?.substring(0,10) ?? ""}   onChange={v => setF("ficha_medica_vence", v || null)} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Autorización</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle value={form.autorizacion} onChange={v => setF("autorizacion", v)} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.autorizacion ? "Sí" : "No"}</span>
                </div>
              </div>
            </>) : (<>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>CI</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: docColor(estCI) }}>{docLabel(estCI)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtFecha(j.ci_vencimiento)}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Ficha médica</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: docColor(estMed) }}>{docLabel(estMed)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtFecha(j.ficha_medica_vence)}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Autorización</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: j.autorizacion ? "#10B981" : "#EF4444" }}>
                  {j.autorizacion ? "Sí" : "No"}
                </span>
              </div>
            </>)}
          </DarkSection>

          {/* Observaciones */}
          <DarkSection title="Observaciones generales">
            {editing ? (
              <textarea value={form.obs_generales ?? ""} onChange={e => setF("obs_generales", e.target.value || null)} rows={3}
                placeholder="Observaciones generales…"
                style={{ width: "100%", background: "var(--bg-card-2)", border: "1px solid var(--border)", color: "#f1f5f9", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none" }} />
            ) : (
              <p style={{ fontSize: 12, color: j.obs_generales ? "var(--text-secondary)" : "var(--text-muted)", whiteSpace: "pre-wrap", minHeight: "1.5rem" }}>
                {j.obs_generales || "Sin observaciones"}
              </p>
            )}
          </DarkSection>
        </div>
      )}

      {/* ── Tab: Estadísticas ──────────────────────────────────────────────── */}
      {tab === "stats" && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <StatBig label="Partidos"    value={String(stats.partidos)}   color="#0EA5E9" />
            <StatBig label="Goles"       value={String(stats.goles)}      color="#F59E0B" />
            <StatBig label="Asistencias" value={String(stats.asistencias)} color="#10B981" />
            <StatBig label="Minutos"     value={String(Math.round(stats.minutos))} color="#EF4444" />
          </div>

          {/* Attendance */}
          <DarkSection title="Asistencia">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <AttPct label="Este mes" pct={stats.pctMes} />
              <AttPct label="Anual"    pct={stats.pctAnual} />
            </div>

            {Object.keys(stats.meses).length > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                  Evolución mensual
                </p>
                {Object.entries(stats.meses).slice(-6).map(([mes, data]) => {
                  const p = Math.round((data.presentes / data.total) * 100);
                  const color = p >= 85 ? "#10B981" : p >= 70 ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={mes} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 44, flexShrink: 0 }}>{mes}</span>
                      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: "right" }}>{p}%</span>
                    </div>
                  );
                })}
              </>
            )}
          </DarkSection>

          <Link href={`/evolucion/${j.id}`} style={{
            display: "block", textAlign: "center", padding: "10px",
            fontSize: 12, color: "#0EA5E9", fontWeight: 700,
            textDecoration: "none",
          }}>
            Ver historial completo →
          </Link>
        </div>
      )}

      {/* ── Tab: Evolución ─────────────────────────────────────────────────── */}
      {tab === "evolucion" && (
        <div className="space-y-4">
          {stats.ultimaEval ? (
            <>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                Última evaluación: {fmtFecha(stats.ultimaEvalFecha)}
              </p>

              {[
                { grupo: "Actitud",  keys: ["conducta","compromiso","respeto","companerismo"] },
                { grupo: "Técnica",  keys: ["control_balon","pase","recepcion","definicion"] },
                { grupo: "Táctica/Físico", keys: ["comprension_tactica","velocidad","coordinacion"] },
              ].map(({ grupo, keys }) => (
                <DarkSection key={grupo} title={grupo}>
                  {EVAL_LABELS.filter(([k]) => keys.includes(k)).map(([key, label]) => {
                    const val = (stats.ultimaEval as Record<string, number>)[key] ?? 0;
                    const pct = (val / 5) * 100;
                    const color = val >= 4 ? "#10B981" : val >= 3 ? "#0EA5E9" : "#F59E0B";
                    return (
                      <div key={key} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color }}>{val}/5</span>
                        </div>
                        <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </DarkSection>
              ))}

              <Link href={`/evolucion/${j.id}`} style={{
                display: "block", textAlign: "center", padding: "10px",
                fontSize: 12, color: "#0EA5E9", fontWeight: 700, textDecoration: "none",
              }}>
                Ver historial de evolución →
              </Link>
            </>
          ) : (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
              padding: "32px 16px", textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin evaluaciones registradas</p>
              <Link href={`/evolucion/${j.id}`} style={{
                display: "inline-block", marginTop: 12, fontSize: 12,
                color: "#0EA5E9", fontWeight: 700, textDecoration: "none",
              }}>
                Agregar evaluación →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DarkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function DF({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function EF({ label, value, onChange, type = "text", style: extStyle }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, width: 120 }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, background: "var(--bg-card-2)", border: "1px solid var(--border)",
          color: "#f1f5f9", borderRadius: 7, padding: "6px 10px", fontSize: 12, outline: "none", minWidth: 0,
          ...extStyle,
        }}
      />
    </div>
  );
}

function DarkInput({ value, onChange, placeholder, type = "text", style: extStyle }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1, background: "var(--bg-card-2)", border: "1px solid var(--border)",
        color: "#f1f5f9", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none",
        ...extStyle,
      }}
    />
  );
}

function DarkSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: "var(--bg-card-2)", border: "1px solid var(--border)",
        color: "#f1f5f9", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none",
      }}>
      {children}
    </select>
  );
}

function DarkBtn({ children, onClick, color, disabled }: {
  children: React.ReactNode; onClick?: () => void; color: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: `${color}18`, color, border: `1px solid ${color}40`,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 800,
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: `${color}18`, color,
      border: `1px solid ${color}35`,
    }}>
      {children}
    </span>
  );
}

function StatBig({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "16px", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
      <p style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 20px ${color}45` }}>
        {value}
      </p>
      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
    </div>
  );
}

function AttPct({ label, pct }: { label: string; pct: number | null }) {
  const color = pct === null ? "var(--text-muted)" : pct >= 85 ? "#10B981" : pct >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{
      background: "var(--bg-card-2)", border: "1px solid var(--border)", borderRadius: 10,
      padding: "12px", textAlign: "center",
    }}>
      <p style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>
        {pct !== null ? `${pct}%` : "—"}
      </p>
      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      style={{
        position: "relative", width: 40, height: 22, borderRadius: 11,
        background: value ? "#10B981" : "#2a4070",
        border: "none", cursor: "pointer",
        transition: "background 0.2s ease",
      }}>
      <span style={{
        position: "absolute", top: 3, left: 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transition: "transform 0.2s ease",
        transform: value ? "translateX(18px)" : "translateX(0)",
        display: "block",
      }} />
    </button>
  );
}
