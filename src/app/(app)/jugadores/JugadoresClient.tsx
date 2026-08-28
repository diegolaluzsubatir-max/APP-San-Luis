"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type JugadorListItem = {
  id: number;
  nombre: string;
  apellido: string;
  numero_camiseta: number | null;
  posicion: string | null;
  posiciones_sec: string | null;
  fichado: boolean;
  estado: string;
  foto_url: string | null;
  pctAnual: number | null;
  goles: number;
  asistencias_stat: number;
};

// ── Helpers de posición ─────────────────────────────────────────────────────────

const POS_ORDER: Record<string, number> = { arquero: 1, defensa: 2, medio: 3, delantero: 4, otros: 5 };
const POS_GROUP: Record<string, string>  = {
  arquero: "Arqueros", defensa: "Defensas", medio: "Mediocampistas", delantero: "Delanteros", otros: "Otros",
};

function getPosKey(pos: string | null): string {
  if (!pos) return "otros";
  const p = pos.toLowerCase();
  if (p.includes("arquero"))   return "arquero";
  if (p.includes("defensa"))   return "defensa";
  if (p.includes("medio"))     return "medio";
  if (p.includes("delantero")) return "delantero";
  return "otros";
}

function posLabel(pos: string | null): string {
  const k = getPosKey(pos);
  if (k === "arquero")   return "Arquero";
  if (k === "defensa")   return "Defensa";
  if (k === "medio")     return "Mediocampista";
  if (k === "delantero") return "Delantero";
  return pos ?? "—";
}

// Etiqueta corta para las secundarias
function posAbrev(pos: string): string {
  const k = getPosKey(pos);
  if (k === "arquero")   return "ARQ";
  if (k === "defensa")   return "DEF";
  if (k === "medio")     return "MED";
  if (k === "delantero") return "DEL";
  return pos.substring(0, 3).toUpperCase();
}

function parseSec(sec: string | null): string[] {
  if (!sec) return [];
  return sec.split(",").map((s) => s.trim()).filter(Boolean);
}

function initials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function pctColor(pct: number): string {
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

// Orden dentro de un grupo: fichados primero, luego por número
function sortEnGrupo(arr: JugadorListItem[]): JugadorListItem[] {
  return [...arr].sort((a, b) => {
    if (a.fichado !== b.fichado) return a.fichado ? -1 : 1;
    return (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99);
  });
}

// ── Fila de jugador ──────────────────────────────────────────────────────────────

function JugadorRow({ j }: { j: JugadorListItem }) {
  const dimmed = !j.fichado;
  const secundarias = parseSec(j.posiciones_sec);
  return (
    <Link
      href={`/jugadores/${j.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        textDecoration: "none",
        opacity: dimmed ? 0.6 : 1,
        transition: "background 0.15s ease",
      }}
      className="hover:bg-[rgba(14,165,233,0.06)] active:scale-[0.99]"
    >
      {/* Número — pastilla azul */}
      <div style={{
        flexShrink: 0,
        width: 30, height: 30, borderRadius: 8,
        background: "rgba(0,71,171,0.9)",
        border: "1px solid rgba(14,165,233,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: "#fff",
        fontVariantNumeric: "tabular-nums",
      }}>
        {j.numero_camiseta ?? "—"}
      </div>

      {/* Foto redonda 44px */}
      <div style={{ flexShrink: 0, position: "relative", width: 44, height: 44 }}>
        {j.foto_url ? (
          <Image
            src={j.foto_url}
            alt=""
            width={44}
            height={44}
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,47,134,0.85) 0%, rgba(14,165,233,0.45) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.8)",
            fontFamily: "'Montserrat', sans-serif",
          }}>
            {initials(j.nombre, j.apellido)}
          </div>
        )}
      </div>

      {/* Nombre + posiciones */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {j.nombre} {j.apellido}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "rgba(241,245,249,0.5)" }}>
            {posLabel(j.posicion)}
          </span>
          {secundarias.map((s) => (
            <span key={s} style={{
              fontSize: 9, fontWeight: 700,
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.25)",
              borderRadius: 3, padding: "0 4px",
              color: "#0EA5E9", letterSpacing: "0.04em",
            }}>
              {posAbrev(s)}
            </span>
          ))}
          {j.estado !== "activo" && (
            <span style={{
              fontSize: 9, fontWeight: 800,
              background: j.estado === "lesionado" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
              color: j.estado === "lesionado" ? "#F59E0B" : "#EF4444",
              borderRadius: 3, padding: "0 5px",
              letterSpacing: "0.04em", textTransform: "capitalize" as const,
            }}>
              {j.estado}
            </span>
          )}
        </div>
      </div>

      {/* % asistencia anual */}
      <div style={{ flexShrink: 0, textAlign: "right", width: 44 }}>
        {j.pctAnual !== null ? (
          <span style={{ fontSize: 15, fontWeight: 800, color: pctColor(j.pctAnual), fontVariantNumeric: "tabular-nums" }}>
            {j.pctAnual}%
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
        )}
      </div>

      {/* Badge fichado / entrena */}
      <div style={{ flexShrink: 0 }}>
        <span style={{
          fontSize: 8, padding: "2px 6px", borderRadius: 4, fontWeight: 800,
          letterSpacing: "0.06em",
          background: j.fichado ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
          color: j.fichado ? "#10B981" : "rgba(241,245,249,0.35)",
          border: `1px solid ${j.fichado ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {j.fichado ? "FCH" : "ENT"}
        </span>
      </div>
    </Link>
  );
}

// ── Encabezado de grupo por posición ─────────────────────────────────────────────

function GrupoHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 14px 6px",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: "#0EA5E9",
        letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        {label}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,245,249,0.3)" }}>
        {count}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e2d4a" }} />
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function JugadoresClient({ jugadores }: { jugadores: JugadorListItem[] }) {
  const [query,      setQuery]      = useState("");
  const [filtroPos,  setFiltroPos]  = useState<string>("todos");
  const [filtroFich, setFiltroFich] = useState<string>("todos");

  const filtered = jugadores.filter((j) => {
    const name = `${j.nombre} ${j.apellido} ${j.numero_camiseta ?? ""}`.toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    // El filtro por posición mira SOLO la posición principal.
    if (filtroPos !== "todos" && getPosKey(j.posicion) !== filtroPos) return false;
    if (filtroFich === "fichados"      && !j.fichado) return false;
    if (filtroFich === "entrenamiento" &&  j.fichado) return false;
    return true;
  });

  // Agrupar por posición principal, en orden ARQ → DEF → MED → DEL → Otros
  const grupos = (["arquero", "defensa", "medio", "delantero", "otros"] as const)
    .map((key) => ({
      key,
      label: POS_GROUP[key],
      jugadores: sortEnGrupo(filtered.filter((j) => getPosKey(j.posicion) === key)),
    }))
    .filter((g) => g.jugadores.length > 0)
    .sort((a, b) => POS_ORDER[a.key] - POS_ORDER[b.key]);

  return (
    <div className="space-y-4 max-w-2xl">

      {/* ── Buscador ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "0 12px", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="rgba(241,245,249,0.35)" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="rgba(241,245,249,0.35)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar jugador o número…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#f1f5f9", fontSize: 13, padding: "10px 0",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              background: "transparent", border: "none",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: 0,
            }}>✕</button>
          )}
        </div>

        {/* Botón: nuevo jugador */}
        <Link href="/jugadores/nuevo" aria-label="Nuevo jugador" style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
          background: "#0EA5E9", border: "1px solid #0EA5E9", borderRadius: 10,
          color: "#fff", textDecoration: "none", padding: "0 14px",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.02em",
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span>Nuevo</span>
        </Link>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { key: "todos",     label: "Todos" },
          { key: "arquero",   label: "ARQ" },
          { key: "defensa",   label: "DEF" },
          { key: "medio",     label: "MED" },
          { key: "delantero", label: "DEL" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltroPos(key)} style={{
            padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", cursor: "pointer",
            background: filtroPos === key ? "#0EA5E9"         : "var(--bg-card)",
            color:      filtroPos === key ? "#fff"            : "var(--text-muted)",
            border: `1px solid ${filtroPos === key ? "#0EA5E9" : "var(--border)"}`,
            transition: "all 0.15s ease",
          }}>
            {label}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--border)", margin: "0 2px" }} />
        {[
          { key: "todos",         label: "Todos" },
          { key: "fichados",      label: "Fichados" },
          { key: "entrenamiento", label: "Entrena" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltroFich(key)} style={{
            padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", cursor: "pointer",
            background: filtroFich === key ? "#F59E0B"         : "var(--bg-card)",
            color:      filtroFich === key ? "#fff"            : "var(--text-muted)",
            border: `1px solid ${filtroFich === key ? "#F59E0B" : "var(--border)"}`,
            transition: "all 0.15s ease",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {filtered.length} jugador{filtered.length !== 1 ? "es" : ""}
      </p>

      {/* ── Listado agrupado ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p style={{
          padding: "32px 0", textAlign: "center",
          fontSize: 13, color: "var(--text-muted)",
        }}>
          Sin resultados
        </p>
      ) : (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {grupos.map((g, gi) => (
            <div key={g.key}>
              <GrupoHeader label={g.label} count={g.jugadores.length} />
              {g.jugadores.map((j, i) => (
                <div key={j.id} style={{
                  borderBottom: i < g.jugadores.length - 1 ? "1px solid rgba(30,45,74,0.5)" : "none",
                }}>
                  <JugadorRow j={j} />
                </div>
              ))}
              {gi < grupos.length - 1 && <div style={{ height: 6 }} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Separador CUERPO TÉCNICO ────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1, height: 1, background: "#1e2d4a" }} />
        <span style={{
          fontSize: 10, fontWeight: 800, color: "rgba(241,245,249,0.4)",
          letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          Cuerpo Técnico
        </span>
        <div style={{ flex: 1, height: 1, background: "#1e2d4a" }} />
      </div>

      {/* ── Card Director Técnico ───────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,71,171,0.35) 0%, rgba(0,40,100,0.25) 100%)",
        border: "1px solid #0047AB",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "stretch",
      }}>
        <div style={{ flexShrink: 0, width: 130 }}>
          <Image
            src="/Ernesto.png"
            alt="Ernesto Fontes"
            width={130}
            height={180}
            style={{
              objectFit: "cover",
              objectPosition: "top center",
              borderRadius: "12px 0 0 12px",
              display: "block",
            }}
          />
        </div>
        <div style={{
          flex: 1, padding: "16px 16px 16px 18px",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, fontWeight: 800, color: "#0EA5E9",
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
              }}>
                Director Técnico
              </p>
              <p style={{
                fontSize: 22, fontWeight: 900, color: "#f1f5f9",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1.15,
              }}>
                Ernesto{"\n"}Fontes
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Escudo.png" alt="Escudo San Luis"
              style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(241,245,249,0.5)", fontWeight: 500 }}>
              Liga Costa de Oro 2026
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800,
              padding: "2px 8px", borderRadius: 4,
              background: "rgba(0,71,171,0.4)",
              border: "1px solid rgba(0,71,171,0.7)",
              color: "#93C5FD",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Cat. 2017 Mixto
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
