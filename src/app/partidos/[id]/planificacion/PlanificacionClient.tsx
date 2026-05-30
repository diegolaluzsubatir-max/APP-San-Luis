"use client";

import { useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Jugador {
  id: number; numero_camiseta: number | null;
  nombre: string; apellido: string; posicion: string | null;
}
interface Participacion { jugadorId: number; cuartos: string; jugador: Jugador }
interface Partido {
  id: number; fecha: string; rival: string; lugar: string | null;
  condicion: string; campeonato: string | null; duracion: number;
  planificacion: Participacion[];
}
interface Props { partido: Partido; jugadoresFichados: Jugador[] }

// ── Constants ──────────────────────────────────────────────────────────────────

const Q_COLORS = ["", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
const Q_NAMES  = ["", "1° Cuarto", "2° Cuarto", "3° Cuarto", "4° Cuarto"];

// ── Helpers ────────────────────────────────────────────────────────────────────

// ── Ordenamiento por posición ──────────────────────────────────────────────────

function posLabel(pos: string | null): string {
  const k = getPosKey(pos);
  return k === "arquero" ? "ARQ" : k === "defensa" ? "DEF" : k === "medio" ? "MED" : k === "delantero" ? "DEL" : "";
}

function getPosKey(pos: string | null): string {
  if (!pos) return "otros";
  const p = pos.toLowerCase();
  if (p.includes("arquero"))   return "arquero";
  if (p.includes("defensa"))   return "defensa";
  if (p.includes("medio"))     return "medio";
  if (p.includes("delantero")) return "delantero";
  return "otros";
}

function posOrder(pos: string | null): number {
  const k = getPosKey(pos);
  return k === "arquero" ? 1 : k === "defensa" ? 2 : k === "medio" ? 3 : k === "delantero" ? 4 : 5;
}

function sortByPos(arr: Jugador[]): Jugador[] {
  return [...arr].sort((a, b) => {
    const oa = posOrder(a.posicion);
    const ob = posOrder(b.posicion);
    if (oa !== ob) return oa - ob;
    return (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99);
  });
}

// ── Build helpers ──────────────────────────────────────────────────────────────

function buildAsignaciones(plan: Participacion[]): Record<number, number[]> {
  const map: Record<number, number[]> = {};
  for (const p of plan) map[p.jugadorId] = JSON.parse(p.cuartos) as number[];
  return map;
}

function buildCols(asig: Record<number, number[]>): Record<number, number[]> {
  const cols: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const [idStr, cuartos] of Object.entries(asig))
    for (const c of cuartos) cols[c].push(parseInt(idStr));
  return cols;
}

function distribuir(ids: number[]): Record<number, number[]> {
  const a: Record<number, number[]> = {};
  for (const id of ids) a[id] = [];
  let i = 0;
  for (let c = 1; c <= 4; c++) for (let s = 0; s < 9; s++) {
    const id = ids[i % ids.length]; a[id].push(c); i++;
  }
  return a;
}

function fmtMin(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtFecha(d: string): string {
  return new Date(d).toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Montevideo",
  });
}

// ── QuarterSection ─────────────────────────────────────────────────────────────

interface QSProps {
  q: number;
  cols: Record<number, number[]>;
  jugadores: Jugador[];
  minPorQStr: string;
  onToggle: (id: number, q: number) => void;
}

function QuarterSection({ q, cols, jugadores, minPorQStr, onToggle }: QSProps) {
  const color        = Q_COLORS[q];
  const titularIds   = cols[q];
  const titulares    = sortByPos(jugadores.filter((j) => titularIds.includes(j.id)));
  const suplentes    = sortByPos(jugadores.filter((j) => !titularIds.includes(j.id)));
  const isFull       = titularIds.length >= 9;

  return (
    <div style={{ border: `1px solid ${color}40`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header del cuarto */}
      <div style={{
        background: `${color}16`, borderBottom: `1px solid ${color}35`,
        padding: "9px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {Q_NAMES[q]}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: titularIds.length === 9 ? "#10B981"
               : titularIds.length > 9  ? "#EF4444"
               : "rgba(241,245,249,0.4)",
        }}>
          {minPorQStr} min · {titularIds.length}/9
        </span>
      </div>

      {/* Titulares */}
      <div style={{ background: "rgba(17,24,39,0.7)" }}>
        <div style={{
          padding: "5px 14px 3px",
          fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
          color, textTransform: "uppercase",
        }}>
          Titulares
        </div>
        {titulares.length === 0 ? (
          <p style={{ padding: "8px 14px", fontSize: 11, color: "rgba(241,245,249,0.2)", margin: 0 }}>
            Sin titulares — tocá un suplente para agregar
          </p>
        ) : titulares.map((j) => (
          <div
            key={j.id}
            onClick={() => onToggle(j.id, q)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
            className="active:bg-[rgba(255,255,255,0.07)]"
          >
            <span style={{
              width: 24, height: 24, borderRadius: 5, flexShrink: 0,
              background: `${color}20`, border: `1px solid ${color}50`,
              color, fontSize: 10, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {j.numero_camiseta ?? "—"}
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
              {j.nombre} {j.apellido}
            </span>
            <span style={{ color: "#EF4444", fontSize: 13, opacity: 0.5, flexShrink: 0 }}>✕</span>
          </div>
        ))}
      </div>

      {/* Suplentes */}
      <div style={{ borderTop: `1px solid ${color}20`, background: "rgba(0,0,0,0.25)" }}>
        <div style={{
          padding: "5px 14px 3px",
          fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
          color: "rgba(241,245,249,0.3)", textTransform: "uppercase",
        }}>
          Suplentes{isFull ? " (cuarto completo)" : " — tap para agregar"}
        </div>
        {suplentes.map((j) => (
          <div
            key={j.id}
            onClick={() => !isFull && onToggle(j.id, q)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 14px",
              borderTop: "1px solid rgba(255,255,255,0.03)",
              cursor: isFull ? "default" : "pointer",
              opacity: isFull ? 0.35 : 0.6,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 5, flexShrink: 0,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(241,245,249,0.35)", fontSize: 9, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {j.numero_camiseta ?? "—"}
            </span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "rgba(241,245,249,0.5)" }}>
              {j.nombre} {j.apellido}
            </span>
            {!isFull && (
              <span style={{ color: "#10B981", fontSize: 14, opacity: 0.7, flexShrink: 0 }}>＋</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function PlanificacionClient({ partido, jugadoresFichados }: Props) {
  const [asignaciones, setAsignaciones] = useState<Record<number, number[]>>(() => {
    const fromDb = buildAsignaciones(partido.planificacion);
    if (Object.keys(fromDb).length === 0 && jugadoresFichados.length > 0)
      return distribuir(sortByPos(jugadoresFichados).map((j) => j.id));
    return fromDb;
  });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [activeQ, setActiveQ]     = useState(1);

  const DURACION   = 50;
  const cols       = buildCols(asignaciones);
  const minPorQ    = DURACION / 4; // 12.5
  const minPorQStr = fmtMin(minPorQ);

  function toggleCuarto(jugadorId: number, cuarto: number) {
    setAsignaciones((prev) => {
      const next = { ...prev };
      const cur  = next[jugadorId] ?? [];
      next[jugadorId] = cur.includes(cuarto)
        ? cur.filter((c) => c !== cuarto)
        : [...cur, cuarto].sort();
      return next;
    });
  }

  function printOficial() {
    document.body.classList.add("print-official");
    const cleanup = () => {
      document.body.classList.remove("print-official");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  function regenerar() {
    setAsignaciones(distribuir(sortByPos(jugadoresFichados).map((j) => j.id)));
    setMsg(null);
  }

  async function guardar() {
    setGuardando(true); setMsg(null);
    try {
      const participaciones = jugadoresFichados
        .filter((j) => (asignaciones[j.id]?.length ?? 0) > 0)
        .map((j) => ({ jugadorId: j.id, cuartos: asignaciones[j.id] }));
      const res = await fetch(`/api/partidos/${partido.id}/planificacion`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participaciones }),
      });
      if (!res.ok) throw new Error();
      setMsg({ ok: true, text: "Guardado correctamente" });
    } catch {
      setMsg({ ok: false, text: "Error al guardar" });
    } finally { setGuardando(false); }
  }

  return (
    <>
      {/* ── Styles ──────────────────────────────────────────────────── */}
      <style>{`
        .btn-touch:active { transform: scale(0.96); }
        .print-planilla { display: none; }
        .print-only { display: none; }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
              box-shadow: none !important; text-shadow: none !important; }
          @page { size: A4 portrait; margin: 15mm 12mm; }

          /* ── MODO PLANILLA OFICIAL (body.print-official) ───────── */
          body.print-official { background: white !important; font-family: Arial, Helvetica, sans-serif; }
          body.print-official header  { display: none !important; }
          body.print-official nav     { display: none !important; }
          body.print-official .no-print { display: none !important; }
          body.print-official .print-only { display: none !important; }
          body.print-official main > *:not(.print-planilla) { display: none !important; }
          body.print-official main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          body.print-official .print-planilla { display: block !important; }

          /* ── Estilos del documento oficial — B&W puro ──────────── */
          .plan-stripe { height: 8px; background: #0047AB !important; width: 100%; margin-bottom: 0; }

          .plan-header {
            display: flex !important; align-items: center; gap: 12px;
            padding: 8px 0 8px; border-bottom: 1.5px solid #000; margin-bottom: 8px;
          }
          .plan-header-club { flex: 1; text-align: center; }
          .plan-header-club-name {
            font-size: 17px; font-weight: 900; color: #000; letter-spacing: 0.04em;
            text-transform: uppercase; margin: 0 0 2px;
          }
          .plan-header-club-sub { font-size: 11px; color: #000; margin: 0; }
          .plan-header-date { text-align: right; font-size: 11px; color: #000; white-space: nowrap; }

          .plan-info {
            background: #fff !important; border: 1.5px solid #000;
            padding: 7px 10px; margin-bottom: 8px;
          }
          .plan-info-title { font-size: 15px; font-weight: 900; color: #000; margin: 0 0 3px; }
          .plan-info-sub   { font-size: 11px; color: #000; margin: 0; }

          .plan-quarters {
            display: grid !important; grid-template-columns: 1fr 1fr;
            gap: 6px; margin-bottom: 8px;
          }
          .plan-q { border: 1.5px solid #000; break-inside: avoid; }
          .plan-q-head {
            background: #0047AB !important; color: #fff !important;
            padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;
          }
          .plan-q-head-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
          .plan-q-head-info  { font-size: 10px; font-weight: 600; }
          .plan-q-row {
            display: flex !important; align-items: center; gap: 6px;
            padding: 3px 8px; min-height: 22px; background: #fff !important;
            border-bottom: 0.5px solid #000; font-size: 11px;
          }
          .plan-q-row:last-child { border-bottom: none; }
          .plan-q-row.arq { background: #fff !important; }
          .plan-q-num    { font-size: 13px; font-weight: 900; color: #000; width: 22px; text-align: right; flex-shrink: 0; }
          .plan-q-nombre { font-size: 12px; font-weight: 700; color: #000; flex: 1; }
          .plan-q-pos    { font-size: 9px; color: #000; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
          .plan-q-arq-badge {
            font-size: 8px; font-weight: 900; color: #000;
            border: 1px solid #000; padding: 0 4px; border-radius: 2px;
          }

          .plan-min-title {
            font-size: 10px; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.1em; color: #000; margin: 0 0 4px;
          }
          .plan-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .plan-table th {
            padding: 4px 6px; border: 1px solid #000;
            background: #000 !important; color: #fff !important;
            font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center;
          }
          .plan-table th:nth-child(1), .plan-table th:nth-child(2) { text-align: left; }
          .plan-table td {
            padding: 3px 6px; border: 0.5px solid #000;
            min-height: 22px; background: #fff !important; color: #000;
          }
          .plan-td-num  { font-size: 12px; font-weight: 900; color: #000; text-align: right; }
          .plan-td-name { font-size: 11px; font-weight: 700; color: #000; }
          .plan-td-dot  { font-size: 13px; text-align: center; color: #000; }
          .plan-td-min  { font-size: 12px; font-weight: 900; color: #000; text-align: center; }
          .plan-td-pct  { font-size: 11px; font-weight: 700; color: #000; text-align: center; }

          .plan-footer {
            margin-top: 10px; border-top: 3px solid #000;
            padding-top: 6px; display: flex !important;
            justify-content: space-between; align-items: flex-start;
          }
          .plan-footer-dt    { font-size: 11px; color: #000; font-weight: 600; }
          .plan-footer-sys   { font-size: 9px; color: #000; text-align: center; }
          .plan-footer-firma { text-align: right; font-size: 10px; color: #000; }
          .plan-footer-firma-line {
            width: 120px; border-bottom: 1.5px solid #000;
            margin: 16px 0 3px auto; display: block;
          }
        }
      `}</style>

      <Header />

      <main style={{ paddingBottom: 150, maxWidth: 620, margin: "0 auto" }} className="p-4">

        {/* ── Info del partido ─────────────────────────────────────── */}
        <div className="no-print" style={{
          background: "rgba(17,24,39,0.90)", backdropFilter: "blur(10px)",
          border: "1px solid #1e2d4a", borderRadius: 14,
          padding: "14px 16px", marginBottom: 12,
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,#0EA5E9,#10B981)", borderRadius: 1, marginBottom: 12 }} />
          <p style={{ fontSize: 18, fontWeight: 900, color: "#f1f5f9", marginBottom: 4, fontFamily: "'Montserrat',sans-serif" }}>
            San Luis <span style={{ color: "rgba(241,245,249,0.4)", fontWeight: 400 }}>vs</span> {partido.rival}
          </p>
          <p style={{ fontSize: 12, color: "rgba(241,245,249,0.5)", marginBottom: 10, textTransform: "capitalize" }}>
            {fmtFecha(partido.fecha)}
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color="#0EA5E9">{partido.condicion === "local" ? "🏠 LOCAL" : "✈️ VISITA"}</Badge>
            {partido.campeonato && <Badge color="rgba(241,245,249,0.4)">🏆 {partido.campeonato}</Badge>}
            {partido.lugar && <Badge color="rgba(241,245,249,0.4)">📍 {partido.lugar}</Badge>}
            <Badge color="rgba(241,245,249,0.3)">⏱ 50 min · 4 × 12.5 min</Badge>
          </div>
        </div>

        {/* ── PLANILLA OFICIAL (solo visible al imprimir con body.print-official) ── */}
        <div className="print-planilla" style={{ display: "none" }}>

          {/* Franja azul */}
          <div className="plan-stripe" />

          {/* Encabezado oficial */}
          <div className="plan-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Escudo.png" alt="" style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
            <div className="plan-header-club">
              <p className="plan-header-club-name">Club Estudiantil San Luis</p>
              <p className="plan-header-club-sub">Categoría 2017 Mixto — Liga Costa de Oro 2026</p>
            </div>
            <div className="plan-header-date">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                {fmtFecha(partido.fecha).replace(/^\w/, c => c.toUpperCase())}
              </p>
              <p style={{ margin: 0, color: "#000", fontSize: 10 }}>
                Planificación de Partido
              </p>
            </div>
          </div>

          {/* Datos del partido */}
          <div className="plan-info">
            <p className="plan-info-title">
              San Luis vs {partido.rival}
              <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 10, color: "#000" }}>
                — {partido.condicion === "local" ? "Local" : "Visitante"}
              </span>
            </p>
            <p className="plan-info-sub">
              {partido.lugar ? `📍 ${partido.lugar}` : ""}
              {partido.campeonato ? ` · ${partido.campeonato}` : ""}
              {" · 50 min · 4 cuartos de 12.5 min · 9 jugadores por cuarto"}
            </p>
          </div>

          {/* Cuartos 2×2 */}
          <div className="plan-quarters">
            {[1, 2, 3, 4].map((q) => {
              const tIds  = cols[q];
              const tJugs = sortByPos(jugadoresFichados.filter((x) => tIds.includes(x.id)));
              return (
                <div key={q} className="plan-q">
                  <div className="plan-q-head">
                    <span className="plan-q-head-title">{Q_NAMES[q]}</span>
                    <span className="plan-q-head-info">{minPorQStr} min · {tIds.length}/9</span>
                  </div>
                  {tJugs.length === 0 ? (
                    <div className="plan-q-row" style={{ color: "#000", fontStyle: "italic" }}>Sin titulares</div>
                  ) : tJugs.map((j) => {
                    const esArq = getPosKey(j.posicion) === "arquero";
                    return (
                      <div key={j.id} className={`plan-q-row${esArq ? " arq" : ""}`}>
                        <span className="plan-q-num">{j.numero_camiseta ?? "—"}</span>
                        <span className="plan-q-nombre">{j.nombre} {j.apellido}</span>
                        {esArq
                          ? <span className="plan-q-arq-badge">ARQ</span>
                          : <span className="plan-q-pos">{posLabel(j.posicion)}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Distribución de minutos */}
          <p className="plan-min-title">Distribución de minutos</p>
          <table className="plan-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Q4</th>
                <th>Min</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {sortByPos(jugadoresFichados).map((j, idx) => {
                const cuartos = asignaciones[j.id] ?? [];
                const min     = cuartos.length * minPorQ;
                const pct     = Math.round((cuartos.length / 4) * 100);
                return (
                  <tr key={j.id}>
                    <td className="plan-td-num">{j.numero_camiseta ?? "—"}</td>
                    <td className="plan-td-name">{j.nombre} {j.apellido}</td>
                    {[1, 2, 3, 4].map((c) => (
                      <td key={c} className="plan-td-dot">
                        {cuartos.includes(c) ? "●" : "○"}
                      </td>
                    ))}
                    <td className="plan-td-min">{fmtMin(min)}</td>
                    <td className="plan-td-pct">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pie de página */}
          <div className="plan-footer">
            <div className="plan-footer-dt">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>Director Técnico: Ernesto Fontes</p>
              <p style={{ margin: 0, color: "#000", fontSize: 10, marginTop: 2 }}>Cat. 2017 Mixto</p>
            </div>
            <div className="plan-footer-sys">
              <p style={{ margin: 0 }}>Sistema de Gestión — Club Estudiantil San Luis</p>
              <p style={{ margin: 0, marginTop: 1 }}>
                {new Date().toLocaleDateString("es-UY", { timeZone: "America/Montevideo" })}
              </p>
            </div>
            <div className="plan-footer-firma">
              <span className="plan-footer-firma-line" />
              Firma DT
            </div>
          </div>

        </div>{/* fin .print-planilla */}

        {/* Print: partido info integrado en el header de arriba */}

        {/* ── Mobile: tab selector ─────────────────────────────────── */}
        <div className="lg:hidden no-print" style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[1, 2, 3, 4].map((q) => {
            const color  = Q_COLORS[q];
            const active = activeQ === q;
            return (
              <button
                key={q}
                onClick={() => setActiveQ(q)}
                className="btn-touch"
                style={{
                  flex: 1, height: 48, borderRadius: 10, border: "none",
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? `${color}20` : "rgba(255,255,255,0.05)",
                  color: active ? color : "rgba(241,245,249,0.4)",
                  outline: active ? `1.5px solid ${color}60` : "1px solid rgba(255,255,255,0.08)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 900 }}>{q}°Q</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>
                  {cols[q].length}/9
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Mobile: active quarter ───────────────────────────────── */}
        <div className="lg:hidden no-print" style={{ marginBottom: 14 }}>
          <QuarterSection
            q={activeQ} cols={cols}
            jugadores={jugadoresFichados}
            minPorQStr={minPorQStr}
            onToggle={toggleCuarto}
          />
        </div>

        {/* ── Desktop: 2×2 grid ────────────────────────────────────── */}
        <div
          className="hidden lg:grid no-print"
          style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}
        >
          {[1, 2, 3, 4].map((q) => (
            <QuarterSection
              key={q} q={q} cols={cols}
              jugadores={jugadoresFichados}
              minPorQStr={minPorQStr}
              onToggle={toggleCuarto}
            />
          ))}
        </div>

        {/* ── Distribución de minutos ──────────────────────────────── */}
        <div style={{
          background: "rgba(17,24,39,0.90)", border: "1px solid #1e2d4a",
          borderRadius: 14, overflow: "hidden", marginBottom: 12,
        }}>
          <div style={{
            padding: "12px 16px 6px",
            fontSize: 10, fontWeight: 800, color: "rgba(241,245,249,0.45)",
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            Distribución de minutos
          </div>

          {sortByPos(jugadoresFichados).map((j, i) => {
            const cuartos = asignaciones[j.id] ?? [];
            const minutos = cuartos.length * minPorQ;
            const pct     = Math.round((cuartos.length / 4) * 100);
            const minColor = pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : pct > 0 ? "#0EA5E9" : "rgba(241,245,249,0.2)";

            return (
              <div key={j.id} style={{
                padding: "9px 16px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}>
                {/* Row: número + nombre + minutos + % */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{
                    width: 22, fontSize: 11, fontWeight: 900,
                    color: "#0EA5E9", textAlign: "right", flexShrink: 0,
                  }}>
                    {j.numero_camiseta ?? "—"}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                    {j.nombre} {j.apellido}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: minColor, flexShrink: 0 }}>
                    {fmtMin(minutos)} min
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 800, width: 36,
                    textAlign: "right", flexShrink: 0, color: minColor,
                  }}>
                    {pct}%
                  </span>
                </div>

                {/* 4-segment progress bar (clickable) */}
                <div style={{ display: "flex", gap: 3, paddingLeft: 30 }}>
                  {[1, 2, 3, 4].map((q) => {
                    const plays = cuartos.includes(q);
                    return (
                      <div
                        key={q}
                        onClick={() => toggleCuarto(j.id, q)}
                        className="no-print"
                        title={`${Q_NAMES[q]} — click para toggle`}
                        style={{
                          flex: 1, height: 9, borderRadius: 5,
                          background: plays ? Q_COLORS[q] : "rgba(255,255,255,0.07)",
                          cursor: "pointer", transition: "all 0.15s",
                          boxShadow: plays ? `0 0 6px ${Q_COLORS[q]}55` : "none",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Q labels */}
                <div className="no-print" style={{ display: "flex", gap: 3, paddingLeft: 30, marginTop: 2 }}>
                  {[1, 2, 3, 4].map((q) => (
                    <div key={q} style={{
                      flex: 1, textAlign: "center",
                      fontSize: 8, fontWeight: 700,
                      color: cuartos.includes(q) ? Q_COLORS[q] : "rgba(241,245,249,0.18)",
                    }}>
                      Q{q}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>


      </main>

      {/* ── Fixed bottom bar ─────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 40,
          background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)",
          borderTop: "1px solid #1e2d4a", padding: "10px 16px",
          display: "flex", gap: 8,
        }}
      >
        <button onClick={regenerar} className="btn-touch" style={{
          flex: 1, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.08)", color: "#f1f5f9",
          fontSize: 11, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase",
        }}>
          🔄 Regen.
        </button>
        <button onClick={guardar} disabled={guardando} className="btn-touch" style={{
          flex: 2, height: 44, borderRadius: 10, border: "none",
          cursor: guardando ? "not-allowed" : "pointer",
          background: guardando ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg,#0EA5E9,#0284c7)",
          color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase",
          boxShadow: guardando ? "none" : "0 4px 14px rgba(14,165,233,0.4)",
        }}>
          {guardando ? "Guardando…" : "💾 Guardar"}
        </button>
        <button onClick={printOficial} className="btn-touch" style={{
          flex: 2, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#0047AB,#003080)",
          color: "#fff", fontSize: 11, fontWeight: 800,
          letterSpacing: "0.4px", textTransform: "uppercase",
          boxShadow: "0 4px 14px rgba(0,71,171,0.4)",
        }}>
          📋 Planilla oficial
        </button>
      </div>

      {/* ── Mensaje ──────────────────────────────────────────────── */}
      {msg && (
        <div className="no-print" style={{
          position: "fixed", bottom: 130, left: 16, right: 16, zIndex: 50,
          padding: "10px 16px", borderRadius: 10, textAlign: "center",
          background: msg.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${msg.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
          color: msg.ok ? "#10B981" : "#EF4444",
          fontSize: 13, fontWeight: 700,
        }}>
          {msg.ok ? "✓ " : "✕ "}{msg.text}
        </div>
      )}

      <BottomNav />
    </>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 5, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}35`,
      letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}
