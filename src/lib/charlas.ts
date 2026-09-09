import { prisma } from "@/lib/prisma";

import { ETIQUETAS, type CharlaRow } from "./charlas-types";
export { ETIQUETAS, type CharlaRow, type Etiqueta } from "./charlas-types";

type RawCharla = { id: number; jugadorId: number; fecha: Date; etiqueta: string | null; temas: string; creado_en: Date };

function parseTemas(s: string): string[] {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function rowToCharla(r: RawCharla): CharlaRow {
  return {
    id: r.id,
    jugadorId: r.jugadorId,
    fecha: new Date(r.fecha).toISOString(),
    etiqueta: r.etiqueta,
    temas: parseTemas(r.temas),
    creado_en: new Date(r.creado_en).toISOString(),
  };
}

/** Misma convención que entrenamientos: mediodía local para evitar corrimientos de día. */
export function parseFechaLocal(s: string): Date {
  const [y, m, d] = s.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Valida y normaliza el body de una charla. Devuelve error legible o los datos limpios. */
export function validarCharla(body: Record<string, unknown>, parcial = false) {
  const out: { fecha?: Date; etiqueta?: string | null; temas?: string[] } = {};

  if (body.fecha !== undefined || !parcial) {
    const f = typeof body.fecha === "string" ? body.fecha : "";
    if (!/^\d{4}-\d{2}-\d{2}/.test(f)) return { error: "Fecha requerida (YYYY-MM-DD)" };
    const d = parseFechaLocal(f);
    if (isNaN(d.getTime())) return { error: "Fecha inválida" };
    out.fecha = d;
  }

  if (body.etiqueta !== undefined || !parcial) {
    const e = body.etiqueta;
    if (e === null || e === undefined || e === "") out.etiqueta = null;
    else if (typeof e === "string" && (ETIQUETAS as readonly string[]).includes(e)) out.etiqueta = e;
    else return { error: "Etiqueta inválida" };
  }

  if (body.temas !== undefined || !parcial) {
    if (!Array.isArray(body.temas)) return { error: "Temas debe ser una lista" };
    const temas = body.temas
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter((t) => t.length > 0);
    if (temas.length === 0) return { error: "Agregá al menos un tema" };
    out.temas = temas;
  }

  return { data: out };
}

export async function getCharlaById(id: number): Promise<CharlaRow | null> {
  const rows = await prisma.$queryRaw<RawCharla[]>`SELECT * FROM "Charla" WHERE id = ${id}`;
  return rows[0] ? rowToCharla(rows[0]) : null;
}

export async function getCharlasDeJugador(jugadorId: number): Promise<CharlaRow[]> {
  const rows = await prisma.$queryRaw<RawCharla[]>`
    SELECT * FROM "Charla" WHERE "jugadorId" = ${jugadorId}
    ORDER BY fecha DESC, id DESC
  `;
  return rows.map(rowToCharla);
}
