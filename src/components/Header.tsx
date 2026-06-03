"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const SECTION_TITLES: [string, string][] = [
  ["/jugadores",      "Plantel"],
  ["/asistencia",     "Asistencia"],
  ["/partidos",       "Partidos"],
  ["/entrenamientos", "Entrenamientos"],
  ["/evolucion",      "Evolución"],
  ["/documentacion",  "Documentación"],
  ["/notas",          "Notas Internas"],
  ["/informes",       "Informes"],
  ["/calendario",     "Calendario"],
  ["/objetivos",      "Objetivos del equipo"],
];

function getTitle(pathname: string): string {
  for (const [prefix, label] of SECTION_TITLES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "San Luis";
}

// Rutas de detalle que muestran flecha ← en vez del escudo
const BACK_ROUTES: [RegExp, string][] = [
  [/^\/(entrenamientos|asistencia)\/\d+/, "/entrenamientos"],
  [/^\/jugadores\/\d+/,                   "/jugadores"],
  [/^\/partidos\/\d+/,                    "/partidos"],
  [/^\/evolucion\/\d+/,                   "/evolucion"],
  [/^\/objetivos$/,                        "/dashboard"],
];

function getBack(pathname: string): string | null {
  for (const [re, href] of BACK_ROUTES) {
    if (re.test(pathname)) return href;
  }
  return null;
}

export default function Header() {
  const pathname    = usePathname();
  const isDashboard = pathname === "/dashboard";
  const title       = getTitle(pathname);
  const backHref    = getBack(pathname);

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        height: 72,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 10,
        background: "rgba(10,15,30,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #1e2d4a",
      }}
    >
      {/* ── Izquierda: flecha ← o escudo ────────────────────────── */}
      {backHref ? (
        <Link
          href={backHref}
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
            color: "#0EA5E9", textDecoration: "none", fontSize: 20, fontWeight: 700,
          }}
          aria-label="Volver"
        >
          ←
        </Link>
      ) : (
        <div style={{
          position: "relative", width: 65, height: 65,
          overflow: "hidden", flexShrink: 0,
        }}>
          <Image
            src="/Escudo.png"
            alt="Club Estudiantil San Luis"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
          <div style={{
            position: "absolute", top: 0, left: "-100%",
            width: "55%", height: "100%",
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
            animation: "shineFifa 3.5s ease-in-out infinite",
            pointerEvents: "none",
          }} />
        </div>
      )}

      {/* ── Centro: título de sección o club ────────────────────── */}
      <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
        {isDashboard ? (
          <>
            <p style={{
              fontSize: 17, fontWeight: 900, color: "#f1f5f9",
              letterSpacing: "0.07em", lineHeight: 1.15,
              fontFamily: "'Montserrat', sans-serif",
              textShadow: "0 1px 8px rgba(0,0,0,0.7)",
            }}>
              CLUB SAN LUIS
            </p>
            <p style={{
              fontSize: 10, fontWeight: 500,
              color: "rgba(241,245,249,0.55)",
              letterSpacing: "0.1em", marginTop: 2,
            }}>
              CATEGORÍA 2017 · MIXTO
            </p>
          </>
        ) : (
          <h1 style={{
            fontWeight: 700, fontSize: 15,
            letterSpacing: "1px", textTransform: "uppercase",
            color: "#f1f5f9",
            fontFamily: "'Montserrat', sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </h1>
        )}
      </div>

      {/* ── Derecha: logo liga (dashboard) o espaciador ─────────── */}
      {isDashboard ? (
        <Image
          src="/costa-de-oro.png"
          alt="Liga Costa de Oro"
          width={65}
          height={65}
          style={{ objectFit: "contain", flexShrink: 0 }}
          priority
        />
      ) : (
        <div style={{ width: 40, flexShrink: 0 }} />
      )}
    </header>
  );
}
