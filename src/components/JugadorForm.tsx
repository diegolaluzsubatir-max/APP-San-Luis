"use client";

import React from "react";

// ─── Tipo del formulario (compartido entre "nuevo" y "editar") ──────────────────
// Es el modelo Jugador editable, SIN el id (que solo existe al editar).
export type JugadorFormData = {
  nombre: string
  apellido: string
  numero_camiseta: number | null
  posicion: string | null
  posiciones_sec: string | null
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

export type JugadorFormSetter = <K extends keyof JugadorFormData>(key: K, value: JugadorFormData[K]) => void

// ─── Posiciones (múltiples, con principal) ──────────────────────────────────────
// Modelo: `posicion` = principal (string); `posiciones_sec` = secundarias en CSV.
// La UI trabaja con una lista ordenada donde el primer item es la principal.

export const POSICIONES = ["Arquero", "Defensa", "Mediocampista", "Delantero"] as const;

export function posSeleccionadas(form: JugadorFormData): string[] {
  const sec = (form.posiciones_sec ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const principal = form.posicion?.trim() || null;
  const list: string[] = [];
  if (principal) list.push(principal);
  for (const s of sec) if (!list.includes(s)) list.push(s);
  return list;
}

function aplicarPos(list: string[], setF: JugadorFormSetter) {
  setF("posicion", list[0] ?? null);
  setF("posiciones_sec", list.slice(1).join(",") || null);
}

export function PosicionesPicker({ form, setF }: { form: JugadorFormData; setF: JugadorFormSetter }) {
  const sel = posSeleccionadas(form);

  function toggle(pos: string) {
    if (sel.includes(pos)) aplicarPos(sel.filter(p => p !== pos), setF);
    else aplicarPos([...sel, pos], setF);
  }
  function setPrincipal(pos: string) {
    if (!sel.includes(pos)) return;
    aplicarPos([pos, ...sel.filter(p => p !== pos)], setF);
  }

  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
        Posiciones <span style={{ color: "rgba(241,245,249,0.35)" }}>· marcá la principal con la estrella</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {POSICIONES.map((pos) => {
          const checked   = sel.includes(pos);
          const principal = checked && sel[0] === pos;
          return (
            <div key={pos} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 8,
              background: checked ? "rgba(14,165,233,0.08)" : "var(--bg-card-2)",
              border: `1px solid ${checked ? "rgba(14,165,233,0.35)" : "var(--border)"}`,
            }}>
              {/* Checkbox */}
              <button type="button" onClick={() => toggle(pos)} style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: 5, cursor: "pointer",
                background: checked ? "#0EA5E9" : "transparent",
                border: `1px solid ${checked ? "#0EA5E9" : "rgba(241,245,249,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}>
                {checked && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l4 4L19 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Etiqueta (toca = toggle) */}
              <button type="button" onClick={() => toggle(pos)} style={{
                flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: checked ? 700 : 500,
                color: checked ? "#f1f5f9" : "var(--text-secondary)", padding: 0,
              }}>
                {pos}
              </button>

              {/* Marcar principal */}
              {checked && (
                principal ? (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                    color: "#0EA5E9",
                  }}>
                    <Estrella filled /> PRINCIPAL
                  </span>
                ) : (
                  <button type="button" onClick={() => setPrincipal(pos)} aria-label="Marcar como principal"
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                    <Estrella />
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Estrella({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill={filled ? "#0EA5E9" : "none"}
      stroke={filled ? "#0EA5E9" : "rgba(241,245,249,0.4)"} strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"
        strokeLinejoin="round" />
    </svg>
  );
}

// Formulario vacío para el alta. Solo nombre y apellido son obligatorios;
// todo lo demás puede quedar vacío y completarse después.
export function emptyJugadorForm(): JugadorFormData {
  return {
    nombre: "",
    apellido: "",
    numero_camiseta: null,
    posicion: null,
    posiciones_sec: null,
    pierna_habil: null,
    estado: "activo",
    fichado: false,
    cedula: null,
    fecha_nacimiento: null,
    direccion: null,
    madre_nombre: null,
    madre_telefono: null,
    padre_nombre: null,
    padre_telefono: null,
    tutor_nombre: null,
    tutor_telefono: null,
    tutor_relacion: null,
    contacto_email: null,
    mutualista: null,
    alergias: null,
    medicacion: null,
    obs_medicas: null,
    obs_generales: null,
    ci_vencimiento: null,
    ficha_medica_vence: null,
    autorizacion: false,
    foto_url: null,
  }
}

// ─── Bloque de identidad (nombre, número, posición, estado…) ────────────────────
// Usado por la página de alta. En el detalle, este bloque vive integrado con la
// foto en el header, por eso ahí se mantiene inline.
export function JugadorIdentityFields({ form, setF }: { form: JugadorFormData; setF: JugadorFormSetter }) {
  return (
    <DarkSection title="Identidad">
      <div className="space-y-2">
        <div style={{ display: "flex", gap: 8 }}>
          <DarkInput value={form.nombre} onChange={v => setF("nombre", v)} placeholder="Nombre *" />
          <DarkInput value={form.apellido} onChange={v => setF("apellido", v)} placeholder="Apellido *" />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <DarkInput value={form.numero_camiseta?.toString() ?? ""} type="number" placeholder="#"
            style={{ width: 64 }}
            onChange={(v: string) => setF("numero_camiseta", v === "" ? null : parseInt(v))} />
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
        <PosicionesPicker form={form} setF={setF} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Fichado:</span>
          <Toggle value={form.fichado} onChange={v => setF("fichado", v)} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.fichado ? "Sí" : "No"}</span>
        </div>
      </div>
    </DarkSection>
  )
}

// ─── Secciones de datos (personales, familia, médicos, docs, obs) ───────────────
// Versión editable, idéntica a la del detalle. Se comparte entre alta y edición.
export function JugadorFormSections({ form, setF }: { form: JugadorFormData; setF: JugadorFormSetter }) {
  return (
    <>
      {/* Datos personales */}
      <DarkSection title="Datos personales">
        <EF label="CI" value={form.cedula ?? ""} onChange={v => setF("cedula", v || null)} />
        <EF label="Nacimiento" type="date" value={form.fecha_nacimiento?.substring(0,10) ?? ""} onChange={v => setF("fecha_nacimiento", v || null)} />
        <EF label="Dirección" value={form.direccion ?? ""} onChange={v => setF("direccion", v || null)} />
      </DarkSection>

      {/* Contacto familiar */}
      <DarkSection title="Contacto familiar">
        <EF label="Nombre madre"  value={form.madre_nombre ?? ""}    onChange={v => setF("madre_nombre", v || null)} />
        <EF label="Tel. madre"    value={form.madre_telefono ?? ""}  onChange={v => setF("madre_telefono", v || null)} />
        <EF label="Nombre padre"  value={form.padre_nombre ?? ""}    onChange={v => setF("padre_nombre", v || null)} />
        <EF label="Tel. padre"    value={form.padre_telefono ?? ""}  onChange={v => setF("padre_telefono", v || null)} />
        <EF label="Nombre tutor"  value={form.tutor_nombre ?? ""}    onChange={v => setF("tutor_nombre", v || null)} />
        <EF label="Tel. tutor"    value={form.tutor_telefono ?? ""}  onChange={v => setF("tutor_telefono", v || null)} />
        <EF label="Relación"      value={form.tutor_relacion ?? ""}  onChange={v => setF("tutor_relacion", v || null)} />
        <EF label="Email"         value={form.contacto_email ?? ""}  onChange={v => setF("contacto_email", v || null)} />
      </DarkSection>

      {/* Datos médicos */}
      <DarkSection title="Datos médicos">
        <EF label="Mutualista" value={form.mutualista ?? ""} onChange={v => setF("mutualista", v || null)} />
        <EF label="Alergias"   value={form.alergias ?? ""}   onChange={v => setF("alergias", v || null)} />
        <EF label="Medicación" value={form.medicacion ?? ""} onChange={v => setF("medicacion", v || null)} />
        <div style={{ paddingTop: 6 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Obs. médicas</p>
          <textarea value={form.obs_medicas ?? ""} onChange={e => setF("obs_medicas", e.target.value || null)} rows={2}
            style={{ width: "100%", background: "var(--bg-card-2)", border: "1px solid var(--border)", color: "#f1f5f9", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none" }} />
        </div>
      </DarkSection>

      {/* Documentación */}
      <DarkSection title="Documentación">
        <EF label="Venc. CI"         type="date" value={form.ci_vencimiento?.substring(0,10) ?? ""}       onChange={v => setF("ci_vencimiento", v || null)} />
        <EF label="Venc. ficha méd." type="date" value={form.ficha_medica_vence?.substring(0,10) ?? ""}   onChange={v => setF("ficha_medica_vence", v || null)} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Autorización</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Toggle value={form.autorizacion} onChange={v => setF("autorizacion", v)} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.autorizacion ? "Sí" : "No"}</span>
          </div>
        </div>
      </DarkSection>

      {/* Observaciones */}
      <DarkSection title="Observaciones generales">
        <textarea value={form.obs_generales ?? ""} onChange={e => setF("obs_generales", e.target.value || null)} rows={3}
          placeholder="Observaciones generales…"
          style={{ width: "100%", background: "var(--bg-card-2)", border: "1px solid var(--border)", color: "#f1f5f9", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "none", outline: "none" }} />
      </DarkSection>
    </>
  )
}

// ─── Primitivos compartidos ─────────────────────────────────────────────────────

export function DarkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export function DF({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export function EF({ label, value, onChange, type = "text", style: extStyle }: {
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

export function DarkInput({ value, onChange, placeholder, type = "text", style: extStyle }: {
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

export function DarkSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
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

export function DarkBtn({ children, onClick, color, disabled }: {
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

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
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

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
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
