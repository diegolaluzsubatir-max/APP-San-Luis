"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print mb-4 px-4 py-2 bg-[#0047AB] text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
    >
      🖨️ Imprimir / PDF
    </button>
  );
}
