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

// ── Separador de sección ───────────────────────────────────────────────────────

function SeparadorSeccion({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
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

// ── Tarjeta de jugador ─────────────────────────────────────────────────────────

function JugadorCard({ j, dimmed }: { j: JugadorListItem; dimmed?: boolean }) {
  return (
    <Link
      href={`/jugadores/${j.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        opacity: dimmed ? 0.68 : 1,
        transition: "border-color 0.15s ease",
      }}
      className="hover:border-[rgba(14,165,233,0.45)] active:scale-[0.97]"
    >
      {/* Foto — cuadrada con padding-bottom trick */}
      <div style={{ position: "relative", paddingBottom: "100%" }}>
        {j.foto_url ? (
          <Image
            src={j.foto_url}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(0,47,134,0.85) 0%, rgba(14,165,233,0.45) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 32, fontWeight: 900,
              color: "rgba(255,255,255,0.72)",
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: "-0.02em",
            }}>
              {initials(j.nombre, j.apellido)}
            </span>
          </div>
        )}

        {/* Número — badge arriba a la izquierda */}
        {j.numero_camiseta !== null && (
          <div style={{
            position: "absolute", top: 6, left: 6,
            background: "rgba(10,15,30,0.82)",
            border: "1px solid rgba(14,165,233,0.5)",
            borderRadius: 6,
            padding: "2px 7px",
            fontSize: 12, fontWeight: 800,
            color: "#0EA5E9", lineHeight: 1.4,
            fontVariantNumeric: "tabular-nums",
          }}>
            {j.numero_camiseta}
          </div>
        )}

        {/* Estado — badge arriba a la derecha (solo si no está activo) */}
        {j.estado !== "activo" && (
          <div style={{
            position: "absolute", top: 6, right: 6,
            background: j.estado === "lesionado" ? "rgba(245,158,11,0.88)" : "rgba(239,68,68,0.88)",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 8, fontWeight: 800,
            color: "#fff",
            letterSpacing: "0.05em",
            textTransform: "capitalize" as const,
          }}>
            {j.estado}
          </div>
        )}
      </div>

      {/* Info debajo de la foto */}
      <div style={{ padding: "8px 10px 10px" }}>
        <p style={{
          fontSize: 13, fontWeight: 700,
          color: "#f1f5f9", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {j.nombre} {j.apellido}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
          <span style={{ fontSize: 11, color: "rgba(241,245,249,0.5)" }}>
            {posLabel(j.posicion)}
          </span>
          {!j.fichado && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3, padding: "0 4px",
              color: "rgba(241,245,249,0.3)",
              letterSpacing: "0.04em",
            }}>
              ENT
            </span>
          )}
        </div>
      </div>
    </Link>
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
    if (filtroPos !== "todos" && !j.posicion?.toLowerCase().includes(filtroPos)) return false;
    if (filtroFich === "fichados"      && !j.fichado) return false;
    if (filtroFich === "entrenamiento" &&  j.fichado) return false;
    return true;
  });

  const fichados   = sortByPos(filtered.filter((j) =>  j.fichado));
  const noFichados = sortByPos(filtered.filter((j) => !j.fichado));
  const showSep    = fichados.length > 0 && noFichados.length > 0;
  const showPosSep = filtroPos === "todos" && !query;

  return (
    <div className="space-y-4 max-w-4xl">

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

      {/* ── Grilla ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <p style={{
            gridColumn: "1 / -1",
            padding: "32px 0", textAlign: "center",
            fontSize: 13, color: "var(--text-muted)",
          }}>
            Sin resultados
          </p>
        ) : (
          <>
            {/* Fichados — con separadores por posición */}
            {(() => {
              const items: React.ReactNode[] = [];
              let lastKey = "";
              fichados.forEach((j) => {
                const key = getPosKey(j.posicion);
                if (showPosSep && key !== lastKey) {
                  lastKey = key;
                  items.push(
                    <div key={`sep-${key}`} style={{ gridColumn: "1 / -1" }}>
                      <SeparadorSeccion label={`— ${POS_LABEL[key] ?? "Otros"} —`} />
                    </div>
                  );
                }
                items.push(<JugadorCard key={j.id} j={j} />);
              });
              return items;
            })()}

            {/* Separador "Solo entrenan" */}
            {showSep && (
              <div style={{ gridColumn: "1 / -1" }}>
                <SeparadorSeccion label="Solo entrenan" />
              </div>
            )}

            {/* No fichados */}
            {noFichados.map((j) => (
              <JugadorCard key={j.id} j={j} dimmed />
            ))}
          </>
        )}
      </div>

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
