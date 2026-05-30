const TZ = "America/Montevideo";

export function fmtFecha(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-UY", {
    ...(opts ?? { day: "2-digit", month: "2-digit", year: "numeric" }),
    timeZone: TZ,
  });
}

export function fmtFechaLarga(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: TZ,
  });
}

export function diasHasta(date: Date | string | null | undefined): number {
  if (!date) return 9999;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy.getTime()) / 86400000);
}

export function estadoDocumento(fecha: Date | string | null | undefined): "vencido" | "por-vencer" | "vigente" | "sin-fecha" {
  if (!fecha) return "sin-fecha";
  const dias = diasHasta(fecha);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "por-vencer";
  return "vigente";
}

export function badgeDoc(estado: string) {
  if (estado === "vencido")    return "bg-red-100 text-red-700";
  if (estado === "por-vencer") return "bg-yellow-100 text-yellow-700";
  if (estado === "vigente")    return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-500";
}

export function labelDoc(estado: string) {
  if (estado === "vencido")    return "Vencido";
  if (estado === "por-vencer") return "Por vencer";
  if (estado === "vigente")    return "Vigente";
  return "Sin fecha";
}

export function iniciales(nombre: string, apellido: string) {
  return (nombre[0] ?? "") + (apellido[0] ?? "");
}

export function resultadoPartido(p: {
  condicion: string;
  goles_local: number | null;
  goles_visita: number | null;
}): "V" | "E" | "D" | null {
  if (p.goles_local === null || p.goles_visita === null) return null;
  if (p.goles_local === p.goles_visita) return "E";
  const ganaSanLuis =
    (p.condicion === "local" && p.goles_local > p.goles_visita) ||
    (p.condicion === "visitante" && p.goles_visita > p.goles_local);
  return ganaSanLuis ? "V" : "D";
}
