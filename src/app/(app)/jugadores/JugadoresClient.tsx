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
  fichado: boolean;
  estado: string;
  foto_url: string | null;
  pct: number | null;
  goles: number;
  asistencias_stat: number;
};

function pctColor(pct: number | null): string {
  if (pct === null) return "rgba(241,245,249,0.25)";
  if (pct >= 85) return "#10B981";
  if (pct >= 70) return "#F59E0B";
  return "#EF4444";
}

function posLabel(pos: string | null): string {
  if (!pos) return "—";
  const p = pos.toLowerCase();
  if (p.includes("arquero"))   return "Arquero";
  if (p.includes("defensa"))   return "Defensa";
  if (p.includes("medio"))     return "Mediocampista";
  if (p.includes("delantero")) return "Delantero";
  return pos;
}

function initials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function CircleProgress({ pct }: { pct: number | null }) {
  const size = 52;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const filled = pct !== null ? (pct / 100) * circ : 0;
  const color = pctColor(pct);

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2d4a" strokeWidth="4" />
      {pct !== null && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="10" fontWeight="700"
        fontFamily="Montserrat, sans-serif"
      >
        {pct !== null ? `${pct}%` : "—"}
      </text>
    </svg>
  );
}

// ── Ordenamiento por posición ──────────────────────────────────────────────────

const POS_ORDER: Record<string, number> = { arquero: 1, defensa: 2, medio: 3, delantero: 4 };
const POS_LABEL: Record<string, string>  = {
  arquero: "Arqueros", defensa: "Defensas", medio: "Mediocampistas", delantero: "Delanteros",
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

function sortByPos(arr: JugadorListItem[]): JugadorListItem[] {
  return [...arr].sort((a, b) => {
    const oa = POS_ORDER[getPosKey(a.posicion)] ?? 5;
    const ob = POS_ORDER[getPosKey(b.posicion)] ?? 5;
    if (oa !== ob) return oa - ob;
    return (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99);
  });
}

// ── Separadores ────────────────────────────────────────────────────────────────

function SeparadorSeccion({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "4px 14px",
      background: "rgba(255,255,255,0.02)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ flex: 1, height: 1, background: "#1e2d4a" }} />
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: "rgba(241,245,249,0.3)",
        letterSpacing: "0.14em", textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e2d4a" }} />
    </div>
  );
}

function JugadorRow({ j, isLast, dimmed }: { j: JugadorListItem; isLast: boolean; dimmed?: boolean }) {
  const color = pctColor(j.pct);
  return (
    <Link
      href={`/jugadores/${j.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        minHeight: 72,
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        textDecoration: "none",
        transition: "background 0.15s ease",
        opacity: dimmed ? 0.78 : 1,
      }}
      className="hover:bg-[rgba(255,255,255,0.03)]"
    >
      {/* Número de camiseta */}
      <div style={{ width: 34, textAlign: "center", flexShrink: 0 }}>
        <span style={{
          fontSize: 20, fontWeight: 800, color: "#0EA5E9", lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {j.numero_camiseta ?? "—"}
        </span>
      </div>

      {/* Avatar */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
        background: j.foto_url ? "transparent" : "rgba(14,165,233,0.14)",
        border: `2px solid ${j.fichado ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {j.foto_url ? (
          <Image src={j.foto_url} alt="" width={52} height={52}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: j.fichado ? "rgba(16,185,129,0.8)" : "rgba(241,245,249,0.35)",
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: "-0.03em",
          }}>
            {initials(j.nombre, j.apellido)}
          </span>
        )}
      </div>

      {/* Nombre + posición */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 16, fontWeight: 700, color: "#f1f5f9",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: "0.01em", lineHeight: 1.2,
        }}>
          {j.nombre} {j.apellido}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 13, color: "rgba(241,245,249,0.55)" }}>{posLabel(j.posicion)}</span>
          {!j.fichado && (
            <span style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 3,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(241,245,249,0.35)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontWeight: 700, letterSpacing: "0.06em",
            }}>
              ENT
            </span>
          )}
          {j.estado !== "activo" && (
            <span style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 3,
              background: j.estado === "lesionado" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)",
              color: j.estado === "lesionado" ? "#F59E0B" : "#EF4444",
              border: `1px solid ${j.estado === "lesionado" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.25)"}`,
              fontWeight: 700, textTransform: "capitalize",
            }}>
              {j.estado}
            </span>
          )}
        </div>
      </div>

      {/* Círculo asistencia */}
      <div style={{ flexShrink: 0 }}>
        <CircleProgress pct={j.pct} />
      </div>

      <span style={{ color: "var(--border-bright)", fontSize: 16, flexShrink: 0 }}>›</span>
    </Link>
  );
}

export default function JugadoresClient({ jugadores }: { jugadores: JugadorListItem[] }) {
  const [query, setQuery] = useState("");
  const [filtroPos, setFiltroPos] = useState<string>("todos");
  const [filtroFich, setFiltroFich] = useState<string>("todos");

  const filtered = jugadores.filter((j) => {
    const name = `${j.nombre} ${j.apellido} ${j.numero_camiseta ?? ""}`.toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    if (filtroPos !== "todos") {
      if (!j.posicion?.toLowerCase().includes(filtroPos)) return false;
    }
    if (filtroFich === "fichados" && !j.fichado) return false;
    if (filtroFich === "entrenamiento" && j.fichado) return false;
    return true;
  });

  const fichados   = sortByPos(filtered.filter((j) => j.fichado));
  const noFichados = sortByPos(filtered.filter((j) => !j.fichado));
  const showSep    = fichados.length > 0 && noFichados.length > 0;

  // Mostrar separadores de posición solo cuando no hay filtro activo
  const showPosSep = filtroPos === "todos" && !query;

  return (
    <div className="space-y-4 max-w-xl">

      {/* ── Search bar ─────────────────────────────────────────── */}
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
              background: "transparent", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: 14, padding: 0,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { key: "todos",     label: "Todos" },
          { key: "arquero",   label: "ARQ" },
          { key: "defensa",   label: "DEF" },
          { key: "medio",     label: "MED" },
          { key: "delantero", label: "DEL" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltroPos(key)}
            style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.06em", cursor: "pointer",
              background: filtroPos === key ? "#0EA5E9" : "var(--bg-card)",
              color: filtroPos === key ? "#fff" : "var(--text-muted)",
              border: `1px solid ${filtroPos === key ? "#0EA5E9" : "var(--border)"}`,
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--border)", margin: "0 2px" }} />
        {[
          { key: "todos",         label: "Todos" },
          { key: "fichados",      label: "Fichados" },
          { key: "entrenamiento", label: "Entrena" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltroFich(key)}
            style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.06em", cursor: "pointer",
              background: filtroFich === key ? "#F59E0B" : "var(--bg-card)",
              color: filtroFich === key ? "#fff" : "var(--text-muted)",
              border: `1px solid ${filtroFich === key ? "#F59E0B" : "var(--border)"}`,
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {filtered.length} jugador{filtered.length !== 1 ? "es" : ""}
      </p>

      {/* ── Lista ──────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {filtered.length === 0 ? (
          <p style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Sin resultados
          </p>
        ) : (
          <>
            {/* Fichados — con separadores de posición */}
            {(() => {
              const items: React.ReactNode[] = [];
              let lastKey = "";
              fichados.forEach((j, i) => {
                const key = getPosKey(j.posicion);
                if (showPosSep && key !== lastKey) {
                  lastKey = key;
                  items.push(
                    <SeparadorSeccion
                      key={`pos-${key}`}
                      label={`— ${POS_LABEL[key] ?? "Otros"} —`}
                    />
                  );
                }
                items.push(
                  <JugadorRow
                    key={j.id}
                    j={j}
                    isLast={!showSep && !showPosSep && i === fichados.length - 1}
                  />
                );
              });
              return items;
            })()}

            {/* Separador "Solo entrenan" */}
            {showSep && <SeparadorSeccion label="Solo entrenan" />}

            {/* No fichados */}
            {noFichados.map((j, i) => (
              <JugadorRow
                key={j.id}
                j={j}
                isLast={i === noFichados.length - 1}
                dimmed
              />
            ))}
          </>
        )}
      </div>

      {/* ── Separador "CUERPO TÉCNICO" ──────────────────────────── */}
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
        width: "100%",
      }}>
        {/* Foto */}
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

        {/* Info */}
        <div style={{
          flex: 1,
          padding: "16px 16px 16px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minWidth: 0,
        }}>
          {/* Top: nombre + escudo */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, fontWeight: 800, color: "#0EA5E9",
                letterSpacing: "0.12em", textTransform: "uppercase",
                marginBottom: 4,
              }}>
                Director Técnico
              </p>
              <p style={{
                fontSize: 22, fontWeight: 900, color: "#f1f5f9",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.03em", textTransform: "uppercase",
                lineHeight: 1.15,
              }}>
                Ernesto{"\n"}Fontes
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Escudo.png"
              alt="Escudo San Luis"
              style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
            />
          </div>

          {/* Bottom: campeonato + badge */}
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
