// Tipos y constantes de Charla compartidos entre server y cliente (sin Prisma).
export const ETIQUETAS = ["Motivación", "Conducta", "Técnica", "Familia", "Otro"] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

export type CharlaRow = {
  id: number;
  jugadorId: number;
  fecha: string;      // ISO
  etiqueta: string | null;
  temas: string[];
  creado_en: string;  // ISO
};

export const ETIQUETA_COLOR: Record<string, string> = {
  "Motivación": "#10B981",
  "Conducta":   "#F59E0B",
  "Técnica":    "#0EA5E9",
  "Familia":    "#A78BFA",
  "Otro":       "rgba(241,245,249,0.45)",
};
