"use client";

import { useState } from "react";

interface Jugador { id: number; nombre: string; apellido: string; numero_camiseta: number | null }

export default function InformesClient({ jugadores }: { jugadores: Jugador[] }) {
  const [jugadorId, setJugadorId] = useState("");

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="space-y-4 no-print max-w-xl">
        {/* Informe individual */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
            Informe individual
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Genera el informe de asistencia y estadísticas de un jugador.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Seleccionar jugador
            </label>
            <select
              value={jugadorId}
              onChange={(e) => setJugadorId(e.target.value)}
              style={{
                width: "100%", background: "var(--bg-card-2)",
                border: "1px solid var(--border)", color: "#f1f5f9",
                borderRadius: 9, padding: "10px 12px", fontSize: 13,
                outline: "none",
              }}
            >
              <option value="">— Elegir jugador —</option>
              {jugadores.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.numero_camiseta ? `#${j.numero_camiseta} ` : ""}{j.nombre} {j.apellido}
                </option>
              ))}
            </select>
          </div>
          <a
            href={jugadorId ? `/informes/jugador/${jugadorId}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "9px 20px", borderRadius: 9,
              fontSize: 12, fontWeight: 800, letterSpacing: "0.06em",
              textDecoration: "none", textTransform: "uppercase",
              background: jugadorId ? "linear-gradient(135deg, #0EA5E9, #0284c7)" : "rgba(255,255,255,0.06)",
              color: jugadorId ? "#fff" : "var(--text-muted)",
              boxShadow: jugadorId ? "0 4px 14px rgba(14,165,233,0.25)" : "none",
              cursor: jugadorId ? "pointer" : "not-allowed",
            }}
          >
            🖨️ Ver e imprimir informe
          </a>
        </div>

        {/* Informe mensual */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
            Informe mensual del equipo
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Asistencia grupal, partidos del mes y tabla de minutos.
          </p>
          <a
            href="/informes/mensual"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block", padding: "9px 20px", borderRadius: 9,
              fontSize: 12, fontWeight: 800, letterSpacing: "0.06em",
              textDecoration: "none", textTransform: "uppercase",
              background: "linear-gradient(135deg, #F59E0B, #d97706)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
            }}
          >
            🖨️ Ver e imprimir informe mensual
          </a>
        </div>
      </div>
    </>
  );
}
