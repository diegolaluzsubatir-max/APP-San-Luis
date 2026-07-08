"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  JugadorFormData, emptyJugadorForm,
  JugadorIdentityFields, JugadorFormSections, DarkBtn,
} from "@/components/JugadorForm";

export default function NuevoJugadorClient() {
  const router = useRouter();
  const [form, setForm]     = useState<JugadorFormData>(emptyJugadorForm());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function setF<K extends keyof JugadorFormData>(k: K, v: JugadorFormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function guardar() {
    setError(null);
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/jugadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        // Ir a la ficha del jugador recién creado (ahí se puede cargar la foto)
        router.push(`/jugadores/${json.id}`);
      } else {
        setError(json?.error ?? `Error ${res.status}`);
        setSaving(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
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

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Solo <b style={{ color: "var(--text-secondary)" }}>nombre</b> y <b style={{ color: "var(--text-secondary)" }}>apellido</b> son obligatorios.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/jugadores" style={{ textDecoration: "none" }}>
            <DarkBtn color="rgba(241,245,249,0.45)">Cancelar</DarkBtn>
          </Link>
          <DarkBtn onClick={guardar} color="#10B981" disabled={saving}>
            {saving ? "Creando…" : "Crear jugador"}
          </DarkBtn>
        </div>
      </div>

      {/* Identidad + resto de secciones (formulario compartido con la edición) */}
      <JugadorIdentityFields form={form} setF={setF} />
      <JugadorFormSections form={form} setF={setF} />

      <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", paddingTop: 4 }}>
        La foto se agrega después, desde el botón <b style={{ color: "var(--text-secondary)" }}>Editar</b> de la ficha.
      </p>
    </div>
  );
}
