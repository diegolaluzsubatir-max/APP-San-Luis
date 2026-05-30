"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Nota {
  id: number;
  titulo: string;
  contenido: string;
  estado: string;
  prioridad: string;
  creado_en: string;
  actualizado: string;
}

type Filtro = "todas" | "pendientes" | "realizadas";
type ModalState =
  | null
  | { tipo: "nuevo" }
  | { tipo: "editar"; nota: Nota };

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    day: "numeric", month: "short", year: "numeric",
    timeZone: "America/Montevideo",
  });
}

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pendiente: { label: "Pendiente", bg: "rgba(245,158,11,0.12)",  color: "#F59E0B", border: "rgba(245,158,11,0.3)"  },
  realizado: { label: "Realizado", bg: "rgba(16,185,129,0.10)",  color: "#10B981", border: "rgba(16,185,129,0.3)"  },
  archivado: { label: "Archivado", bg: "rgba(255,255,255,0.06)", color: "rgba(241,245,249,0.4)", border: "rgba(255,255,255,0.1)" },
};

const PRIORIDAD_BADGE: Record<string, { label: string; bg: string; color: string } | null> = {
  urgente:    { label: "Urgente",    bg: "rgba(239,68,68,0.12)",    color: "#EF4444" },
  importante: { label: "Importante", bg: "rgba(249,115,22,0.12)",   color: "#F97316" },
  normal:     null,
};

// ── Form initial state ─────────────────────────────────────────────────────────

const FORM_EMPTY = { titulo: "", contenido: "", prioridad: "normal" };

// ── Main component ─────────────────────────────────────────────────────────────

export default function NotasClient({ notasIniciales }: { notasIniciales: Nota[] }) {
  const [notas, setNotas]               = useState<Nota[]>(notasIniciales);
  const [filtro, setFiltro]             = useState<Filtro>("todas");
  const [modal, setModal]               = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [form, setForm]                 = useState(FORM_EMPTY);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState("");

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtradas = notas.filter((n) => {
    if (filtro === "pendientes") return n.estado === "pendiente";
    if (filtro === "realizadas") return n.estado === "realizado";
    return true;
  });

  // ── Abrir modal ────────────────────────────────────────────────────────────
  function abrirNuevo() {
    setForm(FORM_EMPTY);
    setError("");
    setModal({ tipo: "nuevo" });
  }

  function abrirEditar(nota: Nota) {
    setForm({ titulo: nota.titulo, contenido: nota.contenido, prioridad: nota.prioridad });
    setError("");
    setModal({ tipo: "editar", nota });
  }

  // ── Guardar (crear o editar) ───────────────────────────────────────────────
  async function guardar() {
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return; }
    setGuardando(true); setError("");

    if (modal?.tipo === "nuevo") {
      const res = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const nueva = await res.json();
        setNotas((prev) => [nueva, ...prev]);
        setModal(null);
      } else { setError("Error al guardar."); }

    } else if (modal?.tipo === "editar") {
      const res = await fetch(`/api/notas/${modal.nota.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const actualizada = await res.json();
        setNotas((prev) => prev.map((n) => n.id === actualizada.id ? actualizada : n));
        setModal(null);
      } else { setError("Error al guardar."); }
    }
    setGuardando(false);
  }

  // ── Marcar resuelta ────────────────────────────────────────────────────────
  async function marcarResuelta(id: number) {
    const res = await fetch(`/api/notas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "realizado" }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setNotas((prev) => prev.map((n) => n.id === id ? actualizada : n));
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function eliminar(id: number) {
    const res = await fetch(`/api/notas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotas((prev) => prev.filter((n) => n.id !== id));
      setConfirmDelete(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-xl space-y-4">

        {/* Título + botón nuevo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{
            fontSize: 22, fontWeight: 900, color: "#f1f5f9",
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Notas Internas
          </h2>
          <button
            onClick={abrirNuevo}
            style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#10B981,#059669)",
              color: "#fff", fontSize: 12, fontWeight: 800,
              letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
            }}
          >
            + Nueva nota
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["todas", "pendientes", "realizadas"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                background: filtro === f ? "#0EA5E9" : "rgba(255,255,255,0.07)",
                color: filtro === f ? "#fff" : "rgba(241,245,249,0.5)",
                textTransform: "capitalize",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Contador */}
        <p style={{ fontSize: 11, color: "rgba(241,245,249,0.4)" }}>
          {filtradas.length} nota{filtradas.length !== 1 ? "s" : ""}
        </p>

        {/* Lista */}
        {filtradas.length === 0 ? (
          <div style={{
            background: "rgba(17,24,39,0.85)", border: "1px solid #1e2d4a",
            borderRadius: 14, padding: "32px 16px", textAlign: "center",
          }}>
            <p style={{ fontSize: 13, color: "rgba(241,245,249,0.35)" }}>
              {filtro === "todas" ? "No hay notas aún. Creá la primera." : `No hay notas ${filtro}.`}
            </p>
          </div>
        ) : filtradas.map((nota) => {
          const estadoBadge    = ESTADO_BADGE[nota.estado] ?? ESTADO_BADGE.pendiente;
          const prioridadBadge = PRIORIDAD_BADGE[nota.prioridad];
          const confirmando    = confirmDelete === nota.id;

          return (
            <div
              key={nota.id}
              style={{
                background: "rgba(17,24,39,0.90)", backdropFilter: "blur(8px)",
                border: `1px solid ${nota.prioridad === "urgente" ? "rgba(239,68,68,0.3)" : nota.prioridad === "importante" ? "rgba(249,115,22,0.25)" : "#1e2d4a"}`,
                borderRadius: 14, overflow: "hidden",
              }}
            >
              {/* Banda de prioridad */}
              {nota.prioridad !== "normal" && (
                <div style={{
                  height: 3,
                  background: nota.prioridad === "urgente" ? "#EF4444" : "#F97316",
                }} />
              )}

              <div style={{ padding: "14px 16px" }}>
                {/* Badges */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 800,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    background: estadoBadge.bg, color: estadoBadge.color, border: `1px solid ${estadoBadge.border}`,
                  }}>
                    {estadoBadge.label}
                  </span>
                  {prioridadBadge && (
                    <span style={{
                      fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 800,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      background: prioridadBadge.bg, color: prioridadBadge.color,
                      border: `1px solid ${prioridadBadge.color}40`,
                    }}>
                      {prioridadBadge.label}
                    </span>
                  )}
                </div>

                {/* Título */}
                <p style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>
                  {nota.titulo}
                </p>

                {/* Contenido */}
                {nota.contenido && (
                  <p style={{
                    fontSize: 13, color: "rgba(241,245,249,0.6)", margin: "0 0 10px",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {nota.contenido}
                  </p>
                )}

                {/* Fecha */}
                <p style={{ fontSize: 11, color: "rgba(241,245,249,0.3)", margin: "0 0 12px" }}>
                  {fmtFecha(nota.creado_en)}
                </p>

                {/* Acciones */}
                {confirmando ? (
                  <div style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 8, padding: "10px 12px",
                  }}>
                    <p style={{ fontSize: 12, color: "#EF4444", fontWeight: 700, margin: "0 0 8px" }}>
                      ¿Borrar esta nota? No se puede deshacer.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          flex: 1, height: 34, borderRadius: 7,
                          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(241,245,249,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >Cancelar</button>
                      <button
                        onClick={() => eliminar(nota.id)}
                        style={{
                          flex: 1, height: 34, borderRadius: 7,
                          background: "#EF4444", border: "none",
                          color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                        }}
                      >Sí, borrar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    {nota.estado !== "realizado" && nota.estado !== "archivado" && (
                      <button
                        onClick={() => marcarResuelta(nota.id)}
                        style={{
                          flex: 1, height: 34, borderRadius: 7, cursor: "pointer",
                          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                          color: "#10B981", fontSize: 11, fontWeight: 800,
                        }}
                      >
                        ✓ Realizado
                      </button>
                    )}
                    <button
                      onClick={() => abrirEditar(nota)}
                      style={{
                        flex: 1, height: 34, borderRadius: 7, cursor: "pointer",
                        background: "rgba(14,165,233,0.10)", border: "1px solid rgba(14,165,233,0.25)",
                        color: "#0EA5E9", fontSize: 11, fontWeight: 800,
                      }}
                    >
                      ✏ Editar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(nota.id)}
                      style={{
                        width: 34, height: 34, borderRadius: 7, cursor: "pointer",
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#EF4444", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal crear / editar ─────────────────────────────────────── */}
      {modal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div
            style={{
              background: "rgba(17,24,39,0.98)", border: "1px solid #1e2d4a",
              borderRadius: "20px 20px 0 0", padding: 20,
              width: "100%", maxWidth: 520,
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a4070", margin: "0 auto 18px" }} />

            <h3 style={{
              fontSize: 16, fontWeight: 900, color: "#f1f5f9",
              fontFamily: "'Montserrat',sans-serif", margin: "0 0 18px",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {modal.tipo === "nuevo" ? "Nueva nota" : "Editar nota"}
            </h3>

            <div className="form-dark space-y-4">
              <div>
                <label>Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Título de la nota..."
                  autoFocus
                />
              </div>

              <div>
                <label>Contenido</label>
                <textarea
                  value={form.contenido}
                  onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))}
                  rows={4}
                  placeholder="Detallá la nota..."
                />
              </div>

              <div>
                <label>Prioridad</label>
                <select
                  value={form.prioridad}
                  onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="importante">Importante</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {error && <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    flex: 1, height: 44, borderRadius: 10,
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(241,245,249,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  style={{
                    flex: 2, height: 44, borderRadius: 10, border: "none",
                    background: guardando ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10B981,#059669)",
                    color: "#fff", fontSize: 13, fontWeight: 800, cursor: guardando ? "not-allowed" : "pointer",
                    boxShadow: guardando ? "none" : "0 4px 14px rgba(16,185,129,0.35)",
                  }}
                >
                  {guardando ? "Guardando…" : modal.tipo === "nuevo" ? "Crear nota" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
