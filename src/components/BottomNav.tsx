"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MAIN_TABS = [
  { href: "/dashboard",      label: "Inicio",        Icon: HomeIcon },
  { href: "/jugadores",      label: "Plantel",       Icon: PlayersIcon },
  { href: "/entrenamientos", label: "Entrenos",      Icon: BallIcon },
  { href: "/partidos",       label: "Partidos",      Icon: TrophyIcon },
  { href: "/notas",          label: "Notas",         Icon: NotasIcon },
];

const MAS_ITEMS = [
  { href: "/asistencia",    label: "Asistencia",    emoji: "✅" },
  { href: "/evolucion",     label: "Evolución",     emoji: "📈" },
  { href: "/documentacion", label: "Documentación", emoji: "📄" },
  { href: "/informes",      label: "Informes",      emoji: "🗂️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [masOpen, setMasOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  return (
    <>
      {/* Drawer "Más" */}
      {masOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setMasOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              bottom: 64,
              left: 0,
              right: 0,
              background: "rgba(17, 24, 39, 0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderTop: "1px solid #1e2d4a",
              borderRadius: "20px 20px 0 0",
              padding: "12px 0 8px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: "#2a4070", margin: "0 auto 16px",
            }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, padding: "0 16px" }}>
              {MAS_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMasOpen(false)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "14px 8px",
                    borderRadius: 12,
                    textDecoration: "none",
                    background: isActive(item.href) ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive(item.href) ? "rgba(14,165,233,0.3)" : "#1e2d4a"}`,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: isActive(item.href) ? "#0EA5E9" : "rgba(241,245,249,0.65)",
                    letterSpacing: "0.04em",
                    textAlign: "center",
                  }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav
        className="flex fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(17, 24, 39, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid #1e2d4a",
          height: 64,
          alignItems: "stretch",
        }}
      >
        {MAIN_TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "#0EA5E9" : "rgba(241,245,249,0.45)",
                transition: "color 0.15s ease",
              }}
            >
              <Icon active={active} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Más tab */}
        <button
          onClick={() => setMasOpen(!masOpen)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: masOpen ? "#0EA5E9" : "rgba(241,245,249,0.45)",
            transition: "color 0.15s ease",
          }}
        >
          <GridIcon active={masOpen} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Más
          </span>
        </button>
      </nav>
    </>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12l9-9 9 9M5 10v10h5v-5h4v5h5V10"
        stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2.5 : 2} />
      <path
        d="M5 21a7 7 0 0 1 14 0"
        stroke="currentColor" strokeWidth={active ? 2.5 : 2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BallIcon({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.75;
  const sw2 = active ? 1.5 : 1.2;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={sw} />
      <polygon
        points="12,5 14.5,8.5 13,12 11,12 9.5,8.5"
        stroke="currentColor" strokeWidth={sw2} strokeLinejoin="round"
      />
      <line x1="12" y1="5" x2="12" y2="3" stroke="currentColor" strokeWidth={sw2} strokeLinecap="round" />
      <line x1="14.5" y1="8.5" x2="18.5" y2="7" stroke="currentColor" strokeWidth={sw2} strokeLinecap="round" />
      <line x1="9.5" y1="8.5" x2="5.5" y2="7" stroke="currentColor" strokeWidth={sw2} strokeLinecap="round" />
      <line x1="13" y1="12" x2="15.5" y2="17" stroke="currentColor" strokeWidth={sw2} strokeLinecap="round" />
      <line x1="11" y1="12" x2="8.5" y2="17" stroke="currentColor" strokeWidth={sw2} strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  const sw = active ? 2.5 : 2;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 21h8M12 17v4M6 5H4c0 4 2 7 4 7M18 5h2c0 4-2 7-4 7"
        stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M6 3h12v8a6 6 0 0 1-12 0V3z"
        stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function NotasIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.5 : 2}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  const op = active ? 1 : 0.85;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="1.5" opacity={op} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" opacity={op} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" opacity={op} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" opacity={op} />
    </svg>
  );
}
