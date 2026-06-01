"use client";

export default function PDFButton({ label = "⬇ Descargar PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{
        fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7,
        border: "1px solid var(--border)", background: "var(--bg-card)",
        color: "#f1f5f9", cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
