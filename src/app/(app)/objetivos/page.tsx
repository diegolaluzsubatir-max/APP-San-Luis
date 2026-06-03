const OBJETIVOS = [
  { nombre: "Diversión",                   votos: 13 },
  { nombre: "Pertenencia al grupo",         votos: 13 },
  { nombre: "Aprendizaje",                  votos: 10 },
  { nombre: "Deporte, físico y ejercicio",  votos:  5 },
  { nombre: "Integración",                  votos:  4 },
  { nombre: "Sociabilizar",                 votos:  4 },
  { nombre: "Compartir",                    votos:  4 },
  { nombre: "Valores",                      votos:  3 },
  { nombre: "Superarse",                    votos:  2 },
  { nombre: "Compromiso",                   votos:  2 },
  { nombre: "Crecimiento personal",         votos:  2 },
  { nombre: "Progresar",                    votos:  1 },
  { nombre: "Responsabilidad",              votos:  1 },
  { nombre: "Frustraciones (manejarlas)",   votos:  1 },
  { nombre: "Felicidad",                    votos:  1 },
  { nombre: "Bajar la presión",             votos:  1 },
  { nombre: "Respeto",                      votos:  1 },
  { nombre: "Disciplina",                   votos:  1 },
  { nombre: "Salir campeón",                votos:  1 },
  { nombre: "Competencia",                  votos:  1 },
];

const MAX_VOTOS = 13;
const TOTAL_VOTOS = OBJETIVOS.reduce((s, o) => s + o.votos, 0);

export default function ObjetivosPage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 0 16px" }}>

      <div style={{ marginBottom: 14, textAlign: "center" }}>
        <p style={{
          fontSize: 11, fontWeight: 600,
          color: "rgba(241,245,249,0.45)",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          Votado por las familias a principio de año
        </p>
      </div>

      <div style={{
        background: "rgba(17,24,39,0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid #1e2d4a",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {OBJETIVOS.map((obj, i) => {
          const isTop = obj.votos === MAX_VOTOS;
          const pct = (obj.votos / MAX_VOTOS) * 100;
          return (
            <div
              key={obj.nombre}
              style={{
                padding: "11px 14px",
                borderBottom: i < OBJETIVOS.length - 1 ? "1px solid #1e2d4a" : "none",
                background: isTop ? "rgba(14,165,233,0.06)" : "transparent",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: isTop ? 700 : 500,
                  color: isTop ? "#f1f5f9" : "rgba(241,245,249,0.8)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {isTop && (
                    <span style={{
                      fontSize: 11, color: "#0EA5E9",
                      fontWeight: 900, lineHeight: 1,
                    }}>★</span>
                  )}
                  {obj.nombre}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 800, flexShrink: 0, marginLeft: 10,
                  color: isTop ? "#0EA5E9" : "rgba(241,245,249,0.45)",
                }}>
                  {obj.votos}
                </span>
              </div>
              <div style={{
                height: 5, borderRadius: 3,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 3,
                  background: isTop
                    ? "linear-gradient(90deg, #0EA5E9, #10B981)"
                    : "rgba(14,165,233,0.35)",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        textAlign: "center", marginTop: 10,
        fontSize: 10, color: "rgba(241,245,249,0.22)",
        letterSpacing: "0.05em",
      }}>
        {TOTAL_VOTOS} votos en total · {OBJETIVOS.length} objetivos
      </p>
    </div>
  );
}
