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
  // Campos extra para exportación a Excel
  cedula: string | null;
  padre_nombre: string | null;
  padre_telefono: string | null;
  madre_nombre: string | null;
  madre_telefono: string | null;
  fecha_nacimiento: string | null;
  ci_vencimiento: string | null;
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

// Orden dentro de un grupo de posición: por número de camiseta
function sortPorNumero(arr: JugadorListItem[]): JugadorListItem[] {
  return [...arr].sort((a, b) => (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99));
}

// Orden de la sección "Solo entrenan": por apellido
function sortPorApellido(arr: JugadorListItem[]): JugadorListItem[] {
  return [...arr].sort((a, b) =>
    a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" })
  );
}

// ── Exportación a Excel ────────────────────────────────────────────────────────

function capitalizar(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Columnas del Excel: [encabezado, valor por jugador]
const COLUMNAS_EXCEL: { header: string; value: (j: JugadorListItem) => string | number }[] = [
  { header: "Cédula",              value: (j) => j.cedula ?? "" },
  { header: "Nombres",             value: (j) => j.nombre },
  { header: "Apellidos",           value: (j) => j.apellido },
  { header: "N° camiseta",         value: (j) => j.numero_camiseta ?? "" },
  { header: "Posición",            value: (j) => posLabel(j.posicion) },
  { header: "Estado",              value: (j) => capitalizar(j.estado) },
  { header: "Fichado",             value: (j) => (j.fichado ? "Sí" : "No") },
  { header: "Nombre del padre",    value: (j) => j.padre_nombre ?? "" },
  { header: "Tel. padre",          value: (j) => j.padre_telefono ?? "" },
  { header: "Nombre de la madre",  value: (j) => j.madre_nombre ?? "" },
  { header: "Tel. madre",          value: (j) => j.madre_telefono ?? "" },
  { header: "Fecha de nacimiento", value: (j) => j.fecha_nacimiento ?? "" },
  { header: "Vencimiento cédula",  value: (j) => j.ci_vencimiento ?? "" },
];

async function exportarExcel(rows: JugadorListItem[]) {
  const XLSX = await import("xlsx-js-style");

  // Ordenado por apellido y luego por nombre (esta app es una sola categoría).
  const ordenados = [...rows].sort((a, b) => {
    const ap = a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" });
    return ap !== 0 ? ap : a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });

  const headers = COLUMNAS_EXCEL.map((c) => c.header);
  const aoa: (string | number)[][] = [
    headers,
    ...ordenados.map((j) => COLUMNAS_EXCEL.map((c) => c.value(j))),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Estilo del encabezado: negrita, texto blanco, fondo azul #0B4EA2
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { patternType: "solid", fgColor: { rgb: "0B4EA2" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  for (let c = 0; c < headers.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[ref]) ws[ref].s = headerStyle;
  }

  // Anchos de columna ajustados al contenido
  ws["!cols"] = COLUMNAS_EXCEL.map((col, c) => {
    const maxLen = aoa.reduce((m, row) => {
      const v = row[c];
      return Math.max(m, v == null ? 0 : String(v).length);
    }, 0);
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  // Congelar la fila de encabezado
  ws["!freeze"] = { xSplit: "0", ySplit: "1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(
    hoy.getDate()
  ).padStart(2, "0")}`;
  XLSX.writeFile(wb, `Jugadores_San_Luis_${fecha}.xlsx`);
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
        padding: "12px 14px",
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

      {/* Foto redonda 64px */}
      <div style={{ flexShrink: 0, position: "relative", width: 64, height: 64 }}>
        {j.foto_url ? (
          <Image
            src={j.foto_url}
            alt=""
            width={64}
            height={64}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,47,134,0.85) 0%, rgba(14,165,233,0.45) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.8)",
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
  const [exportando, setExportando] = useState(false);

  const filtered = jugadores.filter((j) => {
    const name = `${j.nombre} ${j.apellido} ${j.numero_camiseta ?? ""}`.toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    // El filtro por posición mira SOLO la posición principal.
    if (filtroPos !== "todos" && getPosKey(j.posicion) !== filtroPos) return false;
    if (filtroFich === "fichados"      && !j.fichado) return false;
    if (filtroFich === "entrenamiento" &&  j.fichado) return false;
    return true;
  });

  // Solo los FICHADOS se agrupan por posición principal (ARQ → DEF → MED → DEL → Otros).
  const fichados = filtered.filter((j) => j.fichado);
  const grupos = (["arquero", "defensa", "medio", "delantero", "otros"] as const)
    .map((key) => ({
      key,
      label: POS_GROUP[key],
      jugadores: sortPorNumero(fichados.filter((j) => getPosKey(j.posicion) === key)),
    }))
    .filter((g) => g.jugadores.length > 0)
    .sort((a, b) => POS_ORDER[a.key] - POS_ORDER[b.key]);

  // Los NO fichados van juntos al final, ordenados por apellido.
  const soloEntrenan = sortPorApellido(filtered.filter((j) => !j.fichado));

  // ¿Hay algún filtro/búsqueda activo? (define si "Exportar todos" aporta algo)
  const hayFiltros = query.trim() !== "" || filtroPos !== "todos" || filtroFich !== "todos";

  async function handleExport(rows: JugadorListItem[]) {
    if (exportando || rows.length === 0) return;
    setExportando(true);
    try {
      await exportarExcel(rows);
    } catch (e) {
      console.error("Error al exportar Excel:", e);
      alert("No se pudo generar el Excel. Intentá de nuevo.");
    } finally {
      setExportando(false);
    }
  }

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
          {grupos.map((g) => (
            <div key={g.key}>
              <GrupoHeader label={g.label} count={g.jugadores.length} />
              {g.jugadores.map((j, i) => (
                <div key={j.id} style={{
                  borderBottom: i < g.jugadores.length - 1 ? "1px solid rgba(30,45,74,0.5)" : "none",
                }}>
                  <JugadorRow j={j} />
                </div>
              ))}
              <div style={{ height: 6 }} />
            </div>
          ))}

          {/* Sección "Solo entrenan" — todos los no fichados juntos al final */}
          {soloEntrenan.length > 0 && (
            <div>
              <GrupoHeader label="Solo entrenan" count={soloEntrenan.length} />
              {soloEntrenan.map((j, i) => (
                <div key={j.id} style={{
                  borderBottom: i < soloEntrenan.length - 1 ? "1px solid rgba(30,45,74,0.5)" : "none",
                }}>
                  <JugadorRow j={j} />
                </div>
              ))}
            </div>
          )}
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
