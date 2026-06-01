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
interface Cambio {
  id: string;
  cuarto: 2 | 3 | 4;
  saleId: number;
  entraId: number;
}
interface Props { partido: Partido; jugadoresFichados: Jugador[] }

// ── Constants ──────────────────────────────────────────────────────────────────

const Q_COLORS = ["", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
const Q_NAMES  = ["", "1° Cuarto", "2° Cuarto", "3° Cuarto", "4° Cuarto"];

// ── Helpers ────────────────────────────────────────────────────────────────────

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
    const oa = posOrder(a.posicion), ob = posOrder(b.posicion);
    if (oa !== ob) return oa - ob;
    return (a.numero_camiseta ?? 99) - (b.numero_camiseta ?? 99);
  });
}
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
function fmtMin(n: number): string { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function fmtFecha(d: string): string {
  return new Date(d).toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Montevideo",
  });
}
function emparejarCambios(salen: Jugador[], entran: Jugador[]): { pares: { sale: Jugador; entra: Jugador }[] } {
  const salenMut = [...salen], entranMut = [...entran];
  const pares: { sale: Jugador; entra: Jugador }[] = [];
  for (const s of [...salenMut]) {
    const idx = entranMut.findIndex(e => getPosKey(e.posicion) === getPosKey(s.posicion));
    if (idx !== -1) { pares.push({ sale: s, entra: entranMut[idx] }); salenMut.splice(salenMut.indexOf(s), 1); entranMut.splice(idx, 1); }
  }
  while (salenMut.length > 0 && entranMut.length > 0) pares.push({ sale: salenMut.shift()!, entra: entranMut.shift()! });
  return { pares };
}

// ── Core model ─────────────────────────────────────────────────────────────────

function computeLineups(q1: Set<number>, cambios: Cambio[]): Record<number, Set<number>> {
  const lineups: Record<number, Set<number>> = {};
  let current = new Set(q1);
  lineups[1] = new Set(current);
  for (let q = 2; q <= 4; q++) {
    const next = new Set(current);
    for (const c of cambios.filter(x => x.cuarto === q)) { next.delete(c.saleId); next.add(c.entraId); }
    lineups[q] = next;
    current = next;
  }
  return lineups;
}

function reconstruirCambios(cols: Record<number, number[]>, jugadores: Jugador[]): Cambio[] {
  const result: Cambio[] = [];
  let prev = new Set(cols[1] ?? []);
  for (let q = 2; q <= 4; q++) {
    const curr = new Set(cols[q] ?? []);
    const salenJugs  = [...prev].filter(id => !curr.has(id)).map(id => jugadores.find(j => j.id === id)).filter(Boolean) as Jugador[];
    const entranJugs = [...curr].filter(id => !prev.has(id)).map(id => jugadores.find(j => j.id === id)).filter(Boolean) as Jugador[];
    const { pares } = emparejarCambios(salenJugs, entranJugs);
    for (const par of pares)
      result.push({ id: `init-${q}-${par.sale.id}-${par.entra.id}`, cuarto: q as 2 | 3 | 4, saleId: par.sale.id, entraId: par.entra.id });
    prev = curr;
  }
  return result;
}

function encontrarInconsistencias(q1: Set<number>, cambios: Cambio[]): Cambio[] {
  const bad: Cambio[] = [];
  let current = new Set(q1);
  for (let q = 2; q <= 4; q++) {
    for (const c of cambios.filter(x => x.cuarto === q)) {
      if (!current.has(c.saleId) || current.has(c.entraId)) bad.push(c);
      else { current.delete(c.saleId); current.add(c.entraId); }
    }
  }
  return bad;
}

// ── Q1Section ──────────────────────────────────────────────────────────────────

function Q1Section({ q1, jugadores, minPorQStr, onToggle }: {
  q1: Set<number>; jugadores: Jugador[]; minPorQStr: string; onToggle: (id: number) => void;
}) {
  const color = Q_COLORS[1];
  const titulares = sortByPos(jugadores.filter(j => q1.has(j.id)));
  const suplentes = sortByPos(jugadores.filter(j => !q1.has(j.id)));
  const isFull = q1.size >= 9;
  return (
    <div style={{ border: `1px solid ${color}40`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: `${color}16`, borderBottom: `1px solid ${color}35`, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 900, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{Q_NAMES[1]}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: q1.size === 9 ? "#10B981" : q1.size > 9 ? "#EF4444" : "rgba(241,245,249,0.4)" }}>{minPorQStr} min · {q1.size}/9</span>
      </div>
      <div style={{ background: "rgba(17,24,39,0.7)" }}>
        <div style={{ padding: "5px 14px 3px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color, textTransform: "uppercase" }}>Titulares</div>
        {titulares.length === 0
          ? <p style={{ padding: "8px 14px", fontSize: 11, color: "rgba(241,245,249,0.2)", margin: 0 }}>Sin titulares — tocá un suplente para agregar</p>
          : titulares.map(j => (
            <div key={j.id} onClick={() => onToggle(j.id)} className="active:bg-[rgba(255,255,255,0.07)]"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              <span style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, background: `${color}20`, border: `1px solid ${color}50`, color, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.numero_camiseta ?? "—"}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{j.nombre} {j.apellido}</span>
              <span style={{ color: "#EF4444", fontSize: 13, opacity: 0.5, flexShrink: 0 }}>✕</span>
            </div>
          ))}
      </div>
      <div style={{ borderTop: `1px solid ${color}20`, background: "rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "5px 14px 3px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(241,245,249,0.3)", textTransform: "uppercase" }}>
          Suplentes{isFull ? " (cuarto completo)" : " — tap para agregar"}
        </div>
        {suplentes.map(j => (
          <div key={j.id} onClick={() => !isFull && onToggle(j.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.03)", cursor: isFull ? "default" : "pointer", opacity: isFull ? 0.35 : 0.6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: "rgba(255,255,255,0.06)", color: "rgba(241,245,249,0.35)", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.numero_camiseta ?? "—"}</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "rgba(241,245,249,0.5)" }}>{j.nombre} {j.apellido}</span>
            {!isFull && <span style={{ color: "#10B981", fontSize: 14, opacity: 0.7, flexShrink: 0 }}>＋</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QnSection (Q2–Q4) ─────────────────────────────────────────────────────────

function QnSection({ q, lineup, cambiosQ, jugadores, minPorQStr, onSuplenteTap }: {
  q: 2 | 3 | 4; lineup: Set<number>; cambiosQ: Cambio[];
  jugadores: Jugador[]; minPorQStr: string; onSuplenteTap: (entraId: number) => void;
}) {
  const color       = Q_COLORS[q];
  const entranEsteQ = new Set(cambiosQ.map(c => c.entraId));
  const titulares   = sortByPos(jugadores.filter(j => lineup.has(j.id)));
  const suplentes   = sortByPos(jugadores.filter(j => !lineup.has(j.id)));
  return (
    <div style={{ border: `1px solid ${color}40`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: `${color}16`, borderBottom: `1px solid ${color}35`, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{Q_NAMES[q]}</span>
          {cambiosQ.length > 0 && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800, background: `${color}20`, color, border: `1px solid ${color}40`, letterSpacing: "0.04em" }}>
              {cambiosQ.length} cambio{cambiosQ.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: lineup.size === 9 ? "#10B981" : "rgba(241,245,249,0.4)" }}>{minPorQStr} min · {lineup.size}/9</span>
      </div>
      <div style={{ background: "rgba(17,24,39,0.7)" }}>
        <div style={{ padding: "5px 14px 3px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color, textTransform: "uppercase" }}>En cancha</div>
        {titulares.length === 0
          ? <p style={{ padding: "8px 14px", fontSize: 11, color: "rgba(241,245,249,0.2)", margin: 0 }}>Sin jugadores</p>
          : titulares.map(j => {
            const esNuevo = entranEsteQ.has(j.id);
            return (
              <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, background: esNuevo ? "rgba(16,185,129,0.2)" : `${color}20`, border: `1px solid ${esNuevo ? "rgba(16,185,129,0.5)" : `${color}50`}`, color: esNuevo ? "#10B981" : color, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.numero_camiseta ?? "—"}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: esNuevo ? "#a7f3d0" : "#f1f5f9" }}>{j.nombre} {j.apellido}</span>
                {esNuevo && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", letterSpacing: "0.04em" }}>ENTRA</span>}
              </div>
            );
          })}
      </div>
      <div style={{ borderTop: `1px solid ${color}20`, background: "rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "5px 14px 3px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(241,245,249,0.3)", textTransform: "uppercase" }}>
          Banco — tap para hacer cambio
        </div>
        {suplentes.length === 0
          ? <p style={{ padding: "6px 14px", fontSize: 11, color: "rgba(241,245,249,0.2)", margin: 0 }}>Todos en cancha</p>
          : suplentes.map(j => (
            <div key={j.id} onClick={() => onSuplenteTap(j.id)} className="active:bg-[rgba(255,255,255,0.07)]"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", opacity: 0.6, WebkitTapHighlightColor: "transparent" }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: "rgba(255,255,255,0.06)", color: "rgba(241,245,249,0.35)", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.numero_camiseta ?? "—"}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "rgba(241,245,249,0.5)" }}>{j.nombre} {j.apellido}</span>
              <span style={{ color: "#10B981", fontSize: 14, opacity: 0.7, flexShrink: 0 }}>↑</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function PlanificacionClient({ partido, jugadoresFichados }: Props) {

  const [q1, setQ1] = useState<Set<number>>(() => {
    const fromDb = buildAsignaciones(partido.planificacion);
    if (Object.keys(fromDb).length === 0)
      return new Set(sortByPos(jugadoresFichados).slice(0, 9).map(j => j.id));
    return new Set(buildCols(fromDb)[1] ?? []);
  });

  const [cambios, setCambios] = useState<Cambio[]>(() => {
    const fromDb = buildAsignaciones(partido.planificacion);
    if (Object.keys(fromDb).length === 0) return [];
    return reconstruirCambios(buildCols(fromDb), jugadoresFichados);
  });

  const [ausentes,  setAusentes]  = useState<Set<number>>(new Set());
  const [activeQ,   setActiveQ]   = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [msg,       setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [modal,     setModal]     = useState<{ cuarto: number; entraId: number } | null>(null);
  const [confirm,   setConfirm]   = useState<{ texto: string; onConfirm: () => void } | null>(null);

  const DURACION   = 50;
  const minPorQ    = DURACION / 4;
  const minPorQStr = fmtMin(minPorQ);

  const jugadoresActivos = jugadoresFichados.filter(j => !ausentes.has(j.id));
  const lineups          = computeLineups(q1, cambios);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function jLabel(id: number): string {
    const j = jugadoresFichados.find(x => x.id === id);
    if (!j) return `jugador #${id}`;
    return `${j.nombre} ${j.apellido}${j.numero_camiseta != null ? ` (#${j.numero_camiseta})` : ""}`;
  }

  function mensajeCascada(inc: Cambio[]): string {
    const etiq = inc.map(c => `"entra ${jLabel(c.entraId)} en ${Q_NAMES[c.cuarto]}, sale ${jLabel(c.saleId)}"`);
    const lista = etiq.length === 1 ? etiq[0] : etiq.slice(0, -1).join(", ") + " y " + etiq.at(-1);
    return `Al deshacer este cambio, ${etiq.length === 1 ? "el cambio" : "los cambios"} ${lista} ${etiq.length === 1 ? "quedó" : "quedaron"} sin sentido y ${etiq.length === 1 ? "se va a quitar" : "se van a quitar"}.`;
  }

  function toggleQ1(jugadorId: number) {
    if (q1.has(jugadorId)) {
      const newQ1 = new Set(q1); newQ1.delete(jugadorId);
      const inc = encontrarInconsistencias(newQ1, cambios);
      if (inc.length > 0) {
        const incIds = new Set(inc.map(c => c.id));
        setConfirm({ texto: mensajeCascada(inc), onConfirm: () => { setQ1(newQ1); setCambios(prev => prev.filter(c => !incIds.has(c.id))); setConfirm(null); } });
      } else {
        setQ1(newQ1);
      }
    } else {
      if (q1.size < 9) setQ1(prev => new Set([...prev, jugadorId]));
    }
  }

  function toggleAusente(jugadorId: number) {
    if (ausentes.has(jugadorId)) {
      setAusentes(prev => { const s = new Set(prev); s.delete(jugadorId); return s; });
    } else {
      setAusentes(prev => { const s = new Set(prev); s.add(jugadorId); return s; });
      setQ1(prev => { const s = new Set(prev); s.delete(jugadorId); return s; });
      setCambios(prev => prev.filter(c => c.saleId !== jugadorId && c.entraId !== jugadorId));
    }
  }

  function registrarCambio(cuarto: number, saleId: number, entraId: number) {
    setCambios(prev => [...prev, { id: `${Date.now()}-${saleId}-${entraId}`, cuarto: cuarto as 2 | 3 | 4, saleId, entraId }]);
    setModal(null);
  }

  function deshacerCambio(cambioId: string) {
    const restantes = cambios.filter(c => c.id !== cambioId);
    const inc = encontrarInconsistencias(q1, restantes);
    if (inc.length > 0) {
      const incIds = new Set(inc.map(c => c.id));
      setConfirm({ texto: mensajeCascada(inc), onConfirm: () => { setCambios(restantes.filter(c => !incIds.has(c.id))); setConfirm(null); } });
    } else {
      setCambios(restantes);
    }
  }

  function armarQ1() {
    const tieneData = q1.size > 0 || cambios.length > 0;
    const doArmar = () => {
      setQ1(new Set(sortByPos(jugadoresActivos).slice(0, 9).map(j => j.id)));
      setCambios([]); setMsg(null); setConfirm(null);
    };
    if (tieneData) {
      setConfirm({ texto: "Esto va a reemplazar el Q1 con los primeros 9 jugadores por posición y borrar todos los cambios registrados.", onConfirm: doArmar });
    } else {
      doArmar();
    }
  }

  function printOficial() {
    document.body.classList.add("print-official");
    const cleanup = () => { document.body.classList.remove("print-official"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  function printHojaCambios() {
    document.body.classList.add("print-cambios");
    const cleanup = () => { document.body.classList.remove("print-cambios"); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  async function guardar() {
    setGuardando(true); setMsg(null);
    try {
      const participaciones = jugadoresActivos
        .map(j => ({ jugadorId: j.id, cuartos: [1, 2, 3, 4].filter(q => lineups[q].has(j.id)) }))
        .filter(p => p.cuartos.length > 0);
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Styles ──────────────────────────────────────────────────── */}
      <style>{`
        .btn-touch:active { transform: scale(0.96); }
        .print-planilla { display: none; }
        .print-only { display: none; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; text-shadow: none !important; }
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body.print-official { background: white !important; font-family: Arial, Helvetica, sans-serif; }
          body.print-official header  { display: none !important; }
          body.print-official nav     { display: none !important; }
          body.print-official .no-print { display: none !important; }
          body.print-official .print-only { display: none !important; }
          body.print-official main > *:not(.print-planilla) { display: none !important; }
          body.print-official main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          body.print-official .print-planilla { display: block !important; }
          .plan-stripe { height: 8px; background: #0047AB !important; width: 100%; margin-bottom: 0; }
          .plan-header { display: flex !important; align-items: center; gap: 12px; padding: 8px 0 8px; border-bottom: 1.5px solid #000; margin-bottom: 8px; }
          .plan-header-club { flex: 1; text-align: center; }
          .plan-header-club-name { font-size: 17px; font-weight: 900; color: #000; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 2px; }
          .plan-header-club-sub { font-size: 11px; color: #000; margin: 0; }
          .plan-header-date { text-align: right; font-size: 11px; color: #000; white-space: nowrap; }
          .plan-info { background: #fff !important; border: 1.5px solid #000; padding: 7px 10px; margin-bottom: 8px; }
          .plan-info-title { font-size: 15px; font-weight: 900; color: #000; margin: 0 0 3px; }
          .plan-info-sub   { font-size: 11px; color: #000; margin: 0; }
          .plan-quarters { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
          .plan-q { border: 1.5px solid #000; break-inside: avoid; }
          .plan-q-head { background: #0047AB !important; color: #fff !important; padding: 5px 8px; display: flex; justify-content: space-between; align-items: center; }
          .plan-q-head-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
          .plan-q-head-info  { font-size: 10px; font-weight: 600; }
          .plan-q-row { display: flex !important; align-items: center; gap: 6px; padding: 3px 8px; min-height: 22px; background: #fff !important; border-bottom: 0.5px solid #000; font-size: 11px; }
          .plan-q-row:last-child { border-bottom: none; }
          .plan-q-num    { font-size: 13px; font-weight: 900; color: #000; width: 22px; text-align: right; flex-shrink: 0; }
          .plan-q-nombre { font-size: 12px; font-weight: 700; color: #000; flex: 1; }
          .plan-q-pos    { font-size: 9px; color: #000; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
          .plan-q-arq-badge { font-size: 8px; font-weight: 900; color: #000; border: 1px solid #000; padding: 0 4px; border-radius: 2px; }
          .plan-min-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #000; margin: 0 0 4px; }
          .plan-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .plan-table th { padding: 4px 6px; border: 1px solid #000; background: #000 !important; color: #fff !important; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; }
          .plan-table th:nth-child(1), .plan-table th:nth-child(2) { text-align: left; }
          .plan-table td { padding: 3px 6px; border: 0.5px solid #000; min-height: 22px; background: #fff !important; color: #000; }
          .plan-td-num  { font-size: 12px; font-weight: 900; color: #000; text-align: right; }
          .plan-td-name { font-size: 11px; font-weight: 700; color: #000; }
          .plan-td-dot  { font-size: 13px; text-align: center; color: #000; }
          .plan-td-min  { font-size: 12px; font-weight: 900; color: #000; text-align: center; }
          .plan-td-pct  { font-size: 11px; font-weight: 700; color: #000; text-align: center; }
          .plan-footer { margin-top: 10px; border-top: 3px solid #000; padding-top: 6px; display: flex !important; justify-content: space-between; align-items: flex-start; }
          .plan-footer-dt    { font-size: 11px; color: #000; font-weight: 600; }
          .plan-footer-sys   { font-size: 9px; color: #000; text-align: center; }
          .plan-footer-firma { text-align: right; font-size: 10px; color: #000; }
          .plan-footer-firma-line { width: 120px; border-bottom: 1.5px solid #000; margin: 16px 0 3px auto; display: block; }

          /* ── HOJA DE CAMBIOS (body.print-cambios) ────────────── */
          body.print-cambios { background: white !important; font-family: Arial, Helvetica, sans-serif; }
          body.print-cambios header, body.print-cambios nav { display: none !important; }
          body.print-cambios .no-print { display: none !important; }
          body.print-cambios main > *:not(.print-hoja) { display: none !important; }
          body.print-cambios main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          body.print-cambios .print-hoja { display: block !important; }

          .hoja-stripe { height: 6px; background: #185FA5 !important; width: 100%; margin-bottom: 12px; }
          .hoja-header { display: flex !important; align-items: center; gap: 14px; padding: 0 0 10px; border-bottom: 2px solid #185FA5; margin-bottom: 14px; }
          .hoja-title { font-size: 22px; font-weight: 900; color: #185FA5; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 3px; }
          .hoja-partido { font-size: 14px; font-weight: 700; color: #111; margin: 0 0 4px; }
          .hoja-meta { font-size: 11px; color: #555; }
          .hoja-q-block { margin-bottom: 10px; border: 1.5px solid #185FA5; border-radius: 4px; overflow: hidden; break-inside: avoid; }
          .hoja-q-head { background: #185FA5 !important; color: white !important; padding: 7px 12px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
          .hoja-cambio-row { display: flex !important; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 0.5px solid #ddd; }
          .hoja-cambio-row:last-child { border-bottom: none; }
          .hoja-badge { font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.06em; flex-shrink: 0; }
          .hoja-badge-sale  { background: #fde8e8 !important; color: #b91c1c !important; border: 1px solid #fca5a5; }
          .hoja-badge-entra { background: #dcfce7 !important; color: #15803d !important; border: 1px solid #86efac; }
          .hoja-jugador-sale  { font-size: 13px; font-weight: 700; color: #b91c1c; flex: 1; }
          .hoja-jugador-entra { font-size: 13px; font-weight: 700; color: #15803d; flex: 1; }
          .hoja-arrow { font-size: 16px; color: #bbb; flex-shrink: 0; }
          .hoja-sin-cambios { padding: 10px 12px; font-size: 12px; color: #999; font-style: italic; }
          .hoja-footer { margin-top: 14px; }
          .hoja-ausentes-box { border: 1.5px solid #185FA5; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
          .hoja-ausentes-head { background: #185FA5 !important; color: white !important; padding: 6px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .hoja-ausentes-body { padding: 8px 12px; font-size: 12px; color: #333; line-height: 2; }
          .hoja-total { text-align: right; font-size: 12px; color: #555; font-weight: 600; border-top: 1px solid #ddd; padding-top: 6px; margin-top: 6px; }
          .hoja-generated { text-align: right; font-size: 9px; color: #bbb; margin-top: 3px; }
        }
      `}</style>

      <Header />

      <main style={{ paddingBottom: 200, maxWidth: 620, margin: "0 auto" }} className="p-4">

        {/* ── Info del partido ─────────────────────────────────────── */}
        <div className="no-print" style={{ background: "rgba(17,24,39,0.90)", backdropFilter: "blur(10px)", border: "1px solid #1e2d4a", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,#0EA5E9,#10B981)", borderRadius: 1, marginBottom: 12 }} />
          <p style={{ fontSize: 18, fontWeight: 900, color: "#f1f5f9", marginBottom: 4, fontFamily: "'Montserrat',sans-serif" }}>
            San Luis <span style={{ color: "rgba(241,245,249,0.4)", fontWeight: 400 }}>vs</span> {partido.rival}
          </p>
          <p style={{ fontSize: 12, color: "rgba(241,245,249,0.5)", marginBottom: 10, textTransform: "capitalize" }}>{fmtFecha(partido.fecha)}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color="#0EA5E9">{partido.condicion === "local" ? "🏠 LOCAL" : "✈️ VISITA"}</Badge>
            {partido.campeonato && <Badge color="rgba(241,245,249,0.4)">🏆 {partido.campeonato}</Badge>}
            {partido.lugar && <Badge color="rgba(241,245,249,0.4)">📍 {partido.lugar}</Badge>}
            <Badge color="rgba(241,245,249,0.3)">⏱ 50 min · 4 × 12.5 min</Badge>
          </div>
        </div>

        {/* ── Planilla oficial (solo print) ────────────────────────── */}
        <div className="print-planilla" style={{ display: "none" }}>
          <div className="plan-stripe" />
          <div className="plan-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Escudo.png" alt="" style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
            <div className="plan-header-club">
              <p className="plan-header-club-name">Club Estudiantil San Luis</p>
              <p className="plan-header-club-sub">Categoría 2017 Mixto — Liga Costa de Oro 2026</p>
            </div>
            <div className="plan-header-date">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>{fmtFecha(partido.fecha).replace(/^\w/, c => c.toUpperCase())}</p>
              <p style={{ margin: 0, color: "#000", fontSize: 10 }}>Planificación de Partido</p>
            </div>
          </div>
          <div className="plan-info">
            <p className="plan-info-title">San Luis vs {partido.rival}<span style={{ fontWeight: 400, fontSize: 12, marginLeft: 10, color: "#000" }}>— {partido.condicion === "local" ? "Local" : "Visitante"}</span></p>
            <p className="plan-info-sub">{partido.lugar ? `📍 ${partido.lugar}` : ""}{partido.campeonato ? ` · ${partido.campeonato}` : ""}{" · 50 min · 4 cuartos de 12.5 min · 9 jugadores por cuarto"}</p>
          </div>
          <div className="plan-quarters">
            {[1, 2, 3, 4].map(q => {
              const tJugs = sortByPos(jugadoresActivos.filter(x => lineups[q].has(x.id)));
              return (
                <div key={q} className="plan-q">
                  <div className="plan-q-head">
                    <span className="plan-q-head-title">{Q_NAMES[q]}</span>
                    <span className="plan-q-head-info">{minPorQStr} min · {lineups[q].size}/9</span>
                  </div>
                  {tJugs.length === 0
                    ? <div className="plan-q-row" style={{ color: "#000", fontStyle: "italic" }}>Sin titulares</div>
                    : tJugs.map(j => {
                      const esArq = getPosKey(j.posicion) === "arquero";
                      return (
                        <div key={j.id} className="plan-q-row">
                          <span className="plan-q-num">{j.numero_camiseta ?? "—"}</span>
                          <span className="plan-q-nombre">{j.nombre} {j.apellido}</span>
                          {esArq ? <span className="plan-q-arq-badge">ARQ</span> : <span className="plan-q-pos">{posLabel(j.posicion)}</span>}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
          <p className="plan-min-title">Distribución de minutos</p>
          <table className="plan-table">
            <thead><tr><th>#</th><th>Jugador</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Min</th><th>%</th></tr></thead>
            <tbody>
              {sortByPos(jugadoresActivos).map(j => {
                const cuartos = [1, 2, 3, 4].filter(q => lineups[q].has(j.id));
                const min = cuartos.length * minPorQ;
                const pct = Math.round((cuartos.length / 4) * 100);
                return (
                  <tr key={j.id}>
                    <td className="plan-td-num">{j.numero_camiseta ?? "—"}</td>
                    <td className="plan-td-name">{j.nombre} {j.apellido}</td>
                    {[1, 2, 3, 4].map(c => <td key={c} className="plan-td-dot">{cuartos.includes(c) ? "●" : "○"}</td>)}
                    <td className="plan-td-min">{fmtMin(min)}</td>
                    <td className="plan-td-pct">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="plan-footer">
            <div className="plan-footer-dt">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>Director Técnico: Ernesto Fontes</p>
              <p style={{ margin: 0, color: "#000", fontSize: 10, marginTop: 2 }}>Cat. 2017 Mixto</p>
            </div>
            <div className="plan-footer-sys">
              <p style={{ margin: 0 }}>Sistema de Gestión — Club Estudiantil San Luis</p>
              <p style={{ margin: 0, marginTop: 1 }}>{new Date().toLocaleDateString("es-UY", { timeZone: "America/Montevideo" })}</p>
            </div>
            <div className="plan-footer-firma">
              <span className="plan-footer-firma-line" />Firma DT
            </div>
          </div>
        </div>

        {/* ── Hoja de cambios (solo print-cambios) ────────────────── */}
        <div className="print-hoja" style={{ display: "none" }}>
          <div className="hoja-stripe" />
          <div className="hoja-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Escudo.png" alt="" style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <p className="hoja-title">Hoja de cambios</p>
              <p className="hoja-partido">San Luis vs {partido.rival}</p>
              <p className="hoja-meta">
                {fmtFecha(partido.fecha).replace(/^\w/, c => c.toUpperCase())}
                {" · "}
                {partido.condicion === "local" ? "Local" : "Visitante"}
                {partido.lugar ? ` · ${partido.lugar}` : ""}
              </p>
            </div>
          </div>

          {([2, 3, 4] as const).map(q => {
            const qCambios = cambios.filter(c => c.cuarto === q);
            return (
              <div key={q} className="hoja-q-block">
                <div className="hoja-q-head">Empieza {Q_NAMES[q]}</div>
                {qCambios.length === 0 ? (
                  <div className="hoja-sin-cambios">Sin cambios</div>
                ) : qCambios.map(c => {
                  const sale  = jugadoresFichados.find(j => j.id === c.saleId);
                  const entra = jugadoresFichados.find(j => j.id === c.entraId);
                  const nSale  = sale  ? `#${sale.numero_camiseta  ?? "—"} ${sale.nombre}  ${sale.apellido}`  : `#${c.saleId}`;
                  const nEntra = entra ? `#${entra.numero_camiseta ?? "—"} ${entra.nombre} ${entra.apellido}` : `#${c.entraId}`;
                  return (
                    <div key={c.id} className="hoja-cambio-row">
                      <span className="hoja-badge hoja-badge-sale">SALE</span>
                      <span className="hoja-jugador-sale">{nSale}</span>
                      <span className="hoja-arrow">→</span>
                      <span className="hoja-badge hoja-badge-entra">ENTRA</span>
                      <span className="hoja-jugador-entra">{nEntra}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="hoja-footer">
            {ausentes.size > 0 && (
              <div className="hoja-ausentes-box">
                <div className="hoja-ausentes-head">No vienen hoy ({ausentes.size})</div>
                <div className="hoja-ausentes-body">
                  {sortByPos(jugadoresFichados.filter(j => ausentes.has(j.id))).map(j => (
                    <span key={j.id} style={{ marginRight: 16, display: "inline-block" }}>
                      #{j.numero_camiseta ?? "—"} {j.nombre} {j.apellido}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="hoja-total">Total de cambios: {cambios.length}</div>
            <div className="hoja-generated">
              Generado el {new Date().toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* ── ¿Quién no viene hoy? ─────────────────────────────────── */}
        <div className="no-print" style={{ background: "rgba(17,24,39,0.90)", backdropFilter: "blur(10px)", border: "1px solid #1e2d4a", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e2d4a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(241,245,249,0.5)" }}>¿Quién no viene hoy?</span>
            {ausentes.size > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "2px 8px" }}>
                {ausentes.size} ausente{ausentes.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 14px" }}>
            {sortByPos(jugadoresFichados).map(j => {
              const esAusente = ausentes.has(j.id);
              return (
                <button key={j.id} onClick={() => toggleAusente(j.id)} className="btn-touch"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: esAusente ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)", outline: esAusente ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: esAusente ? "#EF4444" : "#0EA5E9" }}>{j.numero_camiseta ?? "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: esAusente ? "#EF4444" : "rgba(241,245,249,0.65)", textDecoration: esAusente ? "line-through" : "none" }}>{j.nombre} {j.apellido}</span>
                  {esAusente && <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em", background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>AUSENTE</span>}
                </button>
              );
            })}
          </div>
          {ausentes.size > 0 && <p style={{ padding: "0 14px 10px", fontSize: 10, color: "rgba(241,245,249,0.3)" }}>Tocá el jugador de nuevo para revertir si aparece a último momento.</p>}
        </div>

        {/* ── Mobile: tab selector ─────────────────────────────────── */}
        <div className="lg:hidden no-print" style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[1, 2, 3, 4].map(q => {
            const color = Q_COLORS[q];
            const active = activeQ === q;
            const count = q === 1 ? q1.size : lineups[q].size;
            return (
              <button key={q} onClick={() => setActiveQ(q)} className="btn-touch"
                style={{ flex: 1, height: 48, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.15s", background: active ? `${color}20` : "rgba(255,255,255,0.05)", color: active ? color : "rgba(241,245,249,0.4)", outline: active ? `1.5px solid ${color}60` : "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 900 }}>{q}°Q</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{count}/9</span>
              </button>
            );
          })}
        </div>

        {/* ── Mobile: cuarto activo ────────────────────────────────── */}
        <div className="lg:hidden no-print" style={{ marginBottom: 14 }}>
          {activeQ === 1
            ? <Q1Section q1={q1} jugadores={jugadoresActivos} minPorQStr={minPorQStr} onToggle={toggleQ1} />
            : <QnSection q={activeQ as 2|3|4} lineup={lineups[activeQ]} cambiosQ={cambios.filter(c => c.cuarto === activeQ)} jugadores={jugadoresActivos} minPorQStr={minPorQStr} onSuplenteTap={id => setModal({ cuarto: activeQ, entraId: id })} />
          }
        </div>

        {/* ── Desktop: 2×2 grid ────────────────────────────────────── */}
        <div className="hidden lg:grid no-print" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Q1Section q1={q1} jugadores={jugadoresActivos} minPorQStr={minPorQStr} onToggle={toggleQ1} />
          {([2, 3, 4] as const).map(q => (
            <QnSection key={q} q={q} lineup={lineups[q]} cambiosQ={cambios.filter(c => c.cuarto === q)} jugadores={jugadoresActivos} minPorQStr={minPorQStr} onSuplenteTap={id => setModal({ cuarto: q, entraId: id })} />
          ))}
        </div>

        {/* ── Lista de cambios ─────────────────────────────────────── */}
        <div className="no-print" style={{ background: "rgba(17,24,39,0.90)", border: "1px solid #1e2d4a", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 800, color: "rgba(241,245,249,0.45)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Cambios entre cuartos
          </div>
          {([2, 3, 4] as const).map(q => {
            const qCambios = cambios.filter(c => c.cuarto === q);
            const colorQ = Q_COLORS[q];
            return (
              <div key={q} style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: qCambios.length > 0 ? 8 : 0 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 800, background: `${colorQ}15`, color: colorQ, border: `1px solid ${colorQ}35`, letterSpacing: "0.04em" }}>
                    EMPIEZA {Q_NAMES[q].toUpperCase()}
                  </span>
                </div>
                {qCambios.length === 0
                  ? <span style={{ fontSize: 12, color: "rgba(241,245,249,0.25)", fontStyle: "italic" }}>Sin cambios</span>
                  : qCambios.map(c => {
                    const sale  = jugadoresFichados.find(j => j.id === c.saleId);
                    const entra = jugadoresFichados.find(j => j.id === c.entraId);
                    const lbl = (j: Jugador | undefined, id: number) =>
                      j ? `${j.nombre} ${j.apellido}${j.numero_camiseta != null ? ` (#${j.numero_camiseta})` : ""}` : `#${id}`;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, fontWeight: 800, background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", letterSpacing: "0.04em" }}>SALE</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{lbl(sale, c.saleId)}</span>
                        <span style={{ fontSize: 14, color: "rgba(241,245,249,0.3)" }}>→</span>
                        <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", letterSpacing: "0.04em" }}>ENTRA</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{lbl(entra, c.entraId)}</span>
                        <button onClick={() => deshacerCambio(c.id)}
                          style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 5, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(241,245,249,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* ── Distribución de minutos ──────────────────────────────── */}
        <div style={{ background: "rgba(17,24,39,0.90)", border: "1px solid #1e2d4a", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "12px 16px 6px", fontSize: 10, fontWeight: 800, color: "rgba(241,245,249,0.45)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Distribución de minutos
          </div>
          {sortByPos(jugadoresActivos).map(j => {
            const cuartos  = [1, 2, 3, 4].filter(q => lineups[q].has(j.id));
            const minutos  = cuartos.length * minPorQ;
            const pct      = Math.round((cuartos.length / 4) * 100);
            const minColor = pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : pct > 0 ? "#0EA5E9" : "rgba(241,245,249,0.2)";
            return (
              <div key={j.id} style={{ padding: "9px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 22, fontSize: 11, fontWeight: 900, color: "#0EA5E9", textAlign: "right", flexShrink: 0 }}>{j.numero_camiseta ?? "—"}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{j.nombre} {j.apellido}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: minColor, flexShrink: 0 }}>{fmtMin(minutos)} min</span>
                  <span style={{ fontSize: 12, fontWeight: 800, width: 36, textAlign: "right", flexShrink: 0, color: minColor }}>{pct}%</span>
                </div>
                <div style={{ display: "flex", gap: 3, paddingLeft: 30 }}>
                  {[1, 2, 3, 4].map(q => (
                    <div key={q} style={{ flex: 1, height: 9, borderRadius: 5, background: cuartos.includes(q) ? Q_COLORS[q] : "rgba(255,255,255,0.07)", transition: "all 0.15s", boxShadow: cuartos.includes(q) ? `0 0 6px ${Q_COLORS[q]}55` : "none" }} />
                  ))}
                </div>
                <div className="no-print" style={{ display: "flex", gap: 3, paddingLeft: 30, marginTop: 2 }}>
                  {[1, 2, 3, 4].map(q => (
                    <div key={q} style={{ flex: 1, textAlign: "center", fontSize: 8, fontWeight: 700, color: cuartos.includes(q) ? Q_COLORS[q] : "rgba(241,245,249,0.18)" }}>Q{q}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ── Fixed bottom bar ─────────────────────────────────────── */}
      <div className="no-print" style={{ position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 40, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #1e2d4a", padding: "10px 16px", display: "flex", gap: 8 }}>
        <button onClick={armarQ1} className="btn-touch" style={{ flex: 1, height: 44, borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "#f1f5f9", fontSize: 11, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          ⚡ Armar Q1
        </button>
        <button onClick={guardar} disabled={guardando} className="btn-touch" style={{ flex: 2, height: 44, borderRadius: 10, border: "none", cursor: guardando ? "not-allowed" : "pointer", background: guardando ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg,#0EA5E9,#0284c7)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", boxShadow: guardando ? "none" : "0 4px 14px rgba(14,165,233,0.4)" }}>
          {guardando ? "Guardando…" : "💾 Guardar"}
        </button>
        <button onClick={printOficial} className="btn-touch" style={{ flex: 2, height: 44, borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0047AB,#003080)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", boxShadow: "0 4px 14px rgba(0,71,171,0.4)" }}>
          📋 Planilla oficial
        </button>
      </div>

      {/* ── Toast ────────────────────────────────────────────────── */}
      {msg && (
        <div className="no-print" style={{ position: "fixed", bottom: 130, left: 16, right: 16, zIndex: 50, padding: "10px 16px", borderRadius: 10, textAlign: "center", background: msg.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msg.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`, color: msg.ok ? "#10B981" : "#EF4444", fontSize: 13, fontWeight: 700 }}>
          {msg.ok ? "✓ " : "✕ "}{msg.text}
        </div>
      )}

      {/* ── Modal: ¿por quién entra? ─────────────────────────────── */}
      {modal && (() => {
        const entra     = jugadoresFichados.find(j => j.id === modal.entraId);
        const titulares = sortByPos(jugadoresActivos.filter(j => lineups[modal.cuarto].has(j.id)));
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end" }} onClick={() => setModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#111827", border: "1px solid #1e2d4a", borderRadius: "16px 16px 0 0", paddingBottom: 32 }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1e2d4a" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(241,245,249,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Empieza {Q_NAMES[modal.cuarto]}</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#f1f5f9" }}>
                  ¿Por quién entra <span style={{ color: "#10B981" }}>#{entra?.numero_camiseta} {entra?.nombre} {entra?.apellido}</span>?
                </p>
              </div>
              <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                {titulares.map(j => (
                  <div key={j.id} onClick={() => registrarCambio(modal.cuarto, j.id, modal.entraId)} className="active:bg-[rgba(255,255,255,0.07)]"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.numero_camiseta ?? "—"}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{j.nombre} {j.apellido}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800, background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", letterSpacing: "0.04em" }}>SALE</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px 0" }}>
                <button onClick={() => setModal(null)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(241,245,249,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Confirm: cascada ─────────────────────────────────────── */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#111827", border: "1px solid #1e2d4a", borderRadius: 16, padding: "20px 20px 24px" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>⚠️ Cambio en cascada</p>
            <p style={{ fontSize: 13, color: "rgba(241,245,249,0.7)", lineHeight: 1.5, marginBottom: 20 }}>{confirm.texto}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(241,245,249,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={confirm.onConfirm} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Sí, deshacer y quitar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}35`, letterSpacing: "0.04em" }}>
      {children}
    </span>
  );
}
