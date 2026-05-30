import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const JUGADORES_DATA = [
  { n: 1,  nombre: "Agustin",       apellido: "Marotta Elhordoy",    ci: "62454178", nac: "2017-01-17", ci_vence: "2028-02-02", med_vence: "2026-09-13", pierna: "derecha",  posicion: "Arquero",    madre: "Claudia Elhordoy",   tel_madre: "099123456", padre: "Rodrigo Marotta",    tel_padre: "098234567", email: "marotta@gmail.com",    mutualista: "CASMU",   autorizacion: true  },
  { n: 2,  nombre: "Alfonso",       apellido: "Borreani Hernandez",  ci: "62878526", nac: "2017-09-30", ci_vence: "2028-09-21", med_vence: "2027-04-27", pierna: "derecha",  posicion: "Defensa",    madre: "Laura Hernandez",    tel_madre: "099345678", padre: "Pablo Borreani",     tel_padre: "098456789", email: "borreani@gmail.com",   mutualista: "IAMC",    autorizacion: true  },
  { n: 3,  nombre: "Bruno Andres",  apellido: "La Luz Gallegos",     ci: "62653877", nac: "2017-05-16", ci_vence: "2028-06-10", med_vence: "2027-03-02", pierna: "izquierda",posicion: "Mediocampo", madre: "Verónica Gallegos",  tel_madre: "099567890", padre: "Diego La Luz",       tel_padre: "098678901", email: "laluz@gmail.com",      mutualista: "CASMU",   autorizacion: true  },
  { n: 4,  nombre: "Felipe",        apellido: "Saralegui Borreani",  ci: "62567993", nac: "2017-03-26", ci_vence: "2028-03-28", med_vence: "2026-08-13", pierna: "derecha",  posicion: "Mediocampo", madre: "Ana Borreani",       tel_madre: "099789012", padre: "Martín Saralegui",   tel_padre: "098890123", email: "saralegui@gmail.com",  mutualista: "COSEM",   autorizacion: true  },
  { n: 5,  nombre: "Francisco",     apellido: "Arotxarena Limongi",  ci: "62457067", nac: "2017-01-18", ci_vence: "2031-11-14", med_vence: "2027-02-22", pierna: "derecha",  posicion: "Delantero",  madre: "Sofía Limongi",      tel_madre: "099901234", padre: "Juan Arotxarena",    tel_padre: "098012345", email: "arotxarena@gmail.com", mutualista: "IAMC",    autorizacion: true  },
  { n: 6,  nombre: "Genaro Denis",  apellido: "Hernández Casagrande",ci: "62910001", nac: "2017-10-21", ci_vence: "2029-04-06", med_vence: "2026-10-10", pierna: "derecha",  posicion: "Defensa",    madre: "Patricia Casagrande",tel_madre: "099112233", padre: "Denis Hernández",    tel_padre: "098223344", email: "hernandez@gmail.com",  mutualista: "CASMU",   autorizacion: true  },
  { n: 7,  nombre: "Ignacio",       apellido: "Martinez Rojas",      ci: "62781723", nac: "2017-08-04", ci_vence: "2028-08-28", med_vence: "2026-04-23", pierna: "derecha",  posicion: "Defensa",    madre: "Gabriela Rojas",     tel_madre: "099334455", padre: "Carlos Martinez",    tel_padre: "098445566", email: "martinez@gmail.com",   mutualista: "COSEM",   autorizacion: true  },
  { n: 8,  nombre: "Joaquin",       apellido: "Roses Zarate",        ci: "62964541", nac: "2017-11-24", ci_vence: "2028-12-06", med_vence: "2026-08-20", pierna: "izquierda",posicion: "Mediocampo", madre: "Valeria Zarate",     tel_madre: "099556677", padre: "Hernán Roses",       tel_padre: "098667788", email: "roses@gmail.com",      mutualista: "IAMC",    autorizacion: true  },
  { n: 9,  nombre: "Juan Andrés",   apellido: "Praderio Martinez",   ci: "62447462", nac: "2017-01-12", ci_vence: "2028-01-13", med_vence: "2027-01-31", pierna: "derecha",  posicion: "Delantero",  madre: "Cecilia Martinez",   tel_madre: "099778899", padre: "Andrés Praderio",    tel_padre: "098889900", email: "praderio@gmail.com",   mutualista: "CASMU",   autorizacion: true  },
  { n: 10, nombre: "Máximo",        apellido: "da Silva Umpiérrez",  ci: "62816348", nac: "2017-08-25", ci_vence: "2028-12-22", med_vence: "2027-02-28", pierna: "derecha",  posicion: "Delantero",  madre: "Natalia Umpiérrez",  tel_madre: "099990011", padre: "Roberto da Silva",   tel_padre: "098001122", email: "dasilva@gmail.com",    mutualista: "COSEM",   autorizacion: true  },
  { n: 11, nombre: "Pablo Bautista",apellido: "Tomikian González",   ci: "62533324", nac: "2017-03-06", ci_vence: "2028-09-09", med_vence: "2026-10-15", pierna: "derecha",  posicion: "Defensa",    madre: "Mónica González",    tel_madre: "099112244", padre: "Ariel Tomikian",     tel_padre: "098223355", email: "tomikian@gmail.com",   mutualista: "IAMC",    autorizacion: true  },
  { n: 12, nombre: "Santino",       apellido: "Osta Renom",          ci: "62750946", nac: "2017-07-17", ci_vence: "2028-09-29", med_vence: "2027-04-30", pierna: "derecha",  posicion: "Mediocampo", madre: "Fernanda Renom",     tel_madre: "099334466", padre: "Sebastián Osta",     tel_padre: "098445577", email: "osta@gmail.com",       mutualista: "CASMU",   autorizacion: true  },
  { n: 13, nombre: "Tomás",         apellido: "Alves Noble",         ci: "62592312", nac: "2017-04-10", ci_vence: "2028-09-10", med_vence: "2027-04-30", pierna: "derecha",  posicion: "Delantero",  madre: "Elena Noble",        tel_madre: "099556688", padre: "Ricardo Alves",      tel_padre: "098667799", email: "alves@gmail.com",      mutualista: "COSEM",   autorizacion: true  },
  { n: 14, nombre: "Valentino",     apellido: "Varela Hernandez",    ci: "62520294", nac: "2017-02-25", ci_vence: "2028-03-07", med_vence: "2027-02-01", pierna: "izquierda",posicion: "Mediocampo", madre: "Karina Hernandez",   tel_madre: "099778800", padre: "Marcelo Varela",     tel_padre: "098889911", email: "varela@gmail.com",     mutualista: "IAMC",    autorizacion: true  },
];

// Attendance patterns for 8 trainings (index = training order, true = present)
const ASISTENCIA_PATTERNS: Record<number, boolean[]> = {
  1:  [true,  true,  true,  true,  true,  true,  true,  true ],  // Agustin   87.5%
  2:  [true,  true,  true,  false, true,  true,  false, true ],  // Alfonso   75%
  3:  [true,  true,  true,  true,  true,  true,  true,  true ],  // Bruno     100%
  4:  [true,  false, true,  true,  false, true,  false, false],  // Felipe    50% ← alert
  5:  [true,  true,  true,  true,  true,  true,  false, true ],  // Francisco 87.5%
  6:  [true,  true,  false, true,  true,  true,  false, true ],  // Genaro    75%
  7:  [false, true,  false, true,  false, true,  true,  false],  // Ignacio   50% ← alert
  8:  [true,  true,  true,  true,  true,  true,  true,  true ],  // Joaquin   100%
  9:  [true,  true,  true,  false, true,  true,  true,  true ],  // Juan And. 87.5%
  10: [true,  true,  false, true,  true,  true,  false, true ],  // Máximo    75%
  11: [true,  true,  true,  true,  false, true,  true,  true ],  // Pablo     87.5%
  12: [true,  false, true,  false, true,  false, true,  false],  // Santino   50% ← alert
  13: [true,  true,  true,  true,  true,  true,  true,  true ],  // Tomás     100%
  14: [true,  true,  true,  true,  false, true,  true,  true ],  // Valentino 87.5%
  15: [true,  false, true,  true,  true,  false, true,  true ],  // Juanmanuel 75%
  16: [false, false, true,  false, true,  false, true,  false],  // Francisco S 37.5% ← alert
};

// Evaluations: [march, may] for each jugador index (1-14)
const EVAL_MARCH = [
  { conducta:4, compromiso:3, respeto:4, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:2, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:3, compromiso:4, respeto:4, companerismo:4, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:5, compromiso:5, respeto:5, companerismo:5, control_balon:4, pase:4, recepcion:4, definicion:3, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:3, compromiso:3, respeto:3, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:3, recepcion:4, definicion:4, comprension_tactica:3, velocidad:4, coordinacion:4 },
  { conducta:4, compromiso:3, respeto:4, companerismo:4, control_balon:3, pase:3, recepcion:3, definicion:2, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:3, compromiso:3, respeto:3, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:3, definicion:3, comprension_tactica:3, velocidad:4, coordinacion:4 },
  { conducta:4, compromiso:4, respeto:4, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:4, comprension_tactica:3, velocidad:4, coordinacion:3 },
  { conducta:5, compromiso:4, respeto:5, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:4, comprension_tactica:4, velocidad:5, coordinacion:4 },
  { conducta:4, compromiso:3, respeto:4, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:3, pase:3, recepcion:3, definicion:2, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:3, recepcion:4, definicion:4, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:3, comprension_tactica:4, velocidad:4, coordinacion:4 },
];

const EVAL_MAY = [
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:3, recepcion:4, definicion:3, comprension_tactica:4, velocidad:3, coordinacion:4 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:4 },
  { conducta:5, compromiso:5, respeto:5, companerismo:5, control_balon:5, pase:5, recepcion:5, definicion:4, comprension_tactica:5, velocidad:4, coordinacion:5 },
  { conducta:3, compromiso:3, respeto:4, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:4, compromiso:5, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:5, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:3, pase:3, recepcion:4, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:3, compromiso:3, respeto:3, companerismo:3, control_balon:3, pase:3, recepcion:3, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:3 },
  { conducta:5, compromiso:4, respeto:5, companerismo:5, control_balon:4, pase:4, recepcion:4, definicion:4, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:4, compromiso:5, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:5, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:5, compromiso:5, respeto:5, companerismo:5, control_balon:5, pase:4, recepcion:5, definicion:5, comprension_tactica:5, velocidad:5, coordinacion:5 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:3, pase:3, recepcion:4, definicion:3, comprension_tactica:3, velocidad:3, coordinacion:4 },
  { conducta:4, compromiso:4, respeto:4, companerismo:4, control_balon:4, pase:4, recepcion:4, definicion:3, comprension_tactica:4, velocidad:4, coordinacion:4 },
  { conducta:5, compromiso:4, respeto:5, companerismo:5, control_balon:4, pase:4, recepcion:5, definicion:5, comprension_tactica:4, velocidad:4, coordinacion:5 },
  { conducta:5, compromiso:5, respeto:5, companerismo:5, control_balon:5, pase:5, recepcion:5, definicion:4, comprension_tactica:5, velocidad:5, coordinacion:5 },
];

function distribuirCuartos(jugadoresIds: number[], duracion: number) {
  const minutosPorCuarto = duracion / 4;
  const asignaciones: Record<number, number[]> = {};
  for (const id of jugadoresIds) asignaciones[id] = [];
  let indice = 0;
  for (let cuarto = 1; cuarto <= 4; cuarto++) {
    for (let slot = 0; slot < 9; slot++) {
      const jugadorId = jugadoresIds[indice % jugadoresIds.length];
      asignaciones[jugadorId].push(cuarto);
      indice++;
    }
  }
  return jugadoresIds.map((id) => ({
    jugadorId: id,
    cuartos: asignaciones[id],
    minutos: asignaciones[id].length * minutosPorCuarto,
  }));
}

async function main() {
  // Delete all in FK-safe order
  await prisma.asistenciaEntrenamiento.deleteMany();
  await prisma.entrenamiento.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.participacionPartido.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.jugador.deleteMany();

  // ── Jugadores fichados ──────────────────────────────────────────────────────
  const jugadoresFichados = [];
  for (let i = 0; i < JUGADORES_DATA.length; i++) {
    const d = JUGADORES_DATA[i];
    const j = await prisma.jugador.create({
      data: {
        numero_camiseta: d.n,
        nombre:          d.nombre,
        apellido:        d.apellido,
        cedula:          d.ci,
        ci_vencimiento:  new Date(d.ci_vence),
        fecha_nacimiento:new Date(d.nac),
        fichado:         true,
        posicion:        d.posicion,
        pierna_habil:    d.pierna,
        estado:          "activo",
        madre_nombre:    d.madre,
        madre_telefono:  d.tel_madre,
        padre_nombre:    d.padre,
        padre_telefono:  d.tel_padre,
        contacto_email:  d.email,
        mutualista:      d.mutualista,
        ficha_medica_vence: new Date(d.med_vence),
        autorizacion:    d.autorizacion,
      },
    });
    jugadoresFichados.push(j);
  }

  // ── Jugadores no fichados ───────────────────────────────────────────────────
  const jNoFichados = await prisma.jugador.createManyAndReturn({
    data: [
      { nombre: "Juanmanuel", apellido: "Salvatore", fichado: false, estado: "activo" },
      { nombre: "Francisco",  apellido: "Simbrelo",  fichado: false, estado: "activo" },
    ],
  });
  const todosJugadores = [...jugadoresFichados, ...jNoFichados];

  // ── Partidos históricos ─────────────────────────────────────────────────────
  const histPartidos = [
    { fecha:"2026-04-13", rival:"Nacional Baby",    condicion:"local",    goles_l:3, goles_v:2 },
    { fecha:"2026-04-27", rival:"Peñarol Baby",     condicion:"local",    goles_l:1, goles_v:1 },
    { fecha:"2026-05-04", rival:"Defensor Sporting",condicion:"visitante",goles_l:0, goles_v:2 },
    { fecha:"2026-05-18", rival:"River Plate Baby", condicion:"local",    goles_l:0, goles_v:1 },
  ];
  const partidosHistoricos = [];
  for (const p of histPartidos) {
    const partido = await prisma.partido.create({
      data: {
        fecha:       new Date(p.fecha + "T10:00:00"),
        rival:       p.rival,
        condicion:   p.condicion,
        campeonato:  "Liga Costa de Oro 2026",
        duracion:    100,
        goles_local: p.goles_l,
        goles_visita:p.goles_v,
        estado:      "jugado",
      },
    });
    partidosHistoricos.push(partido);
  }

  // Goals/assists for historical games
  const golesPartido: Record<number, Record<number, { goles:number; asistencias_stat:number }>> = {
    0: { // vs Nacional 3-2
      3:  { goles:2, asistencias_stat:1 }, // Bruno
      14: { goles:1, asistencias_stat:0 }, // Valentino
      4:  { goles:0, asistencias_stat:2 }, // Felipe
    },
    1: { // vs Peñarol 1-1
      1:  { goles:1, asistencias_stat:0 }, // Agustin
      13: { goles:0, asistencias_stat:1 }, // Tomás
    },
    2: { // vs Defensor 0-2 (visitante)
      10: { goles:1, asistencias_stat:1 }, // Máximo
      8:  { goles:1, asistencias_stat:0 }, // Joaquin
    },
    3: {}, // vs River Plate 0-1 — no goals
  };

  for (let pi = 0; pi < partidosHistoricos.length; pi++) {
    const partido = partidosHistoricos[pi];
    const dist = distribuirCuartos(jugadoresFichados.map(j=>j.id), 100);
    for (const d of dist) {
      const extra = golesPartido[pi]?.[d.jugadorId] ?? { goles:0, asistencias_stat:0 };
      await prisma.participacionPartido.create({
        data: {
          partidoId: partido.id,
          jugadorId: d.jugadorId,
          cuartos:   JSON.stringify(d.cuartos),
          minutos:   d.minutos,
          titular:   true,
          goles:     extra.goles,
          asistencias_stat: extra.asistencias_stat,
        },
      });
    }
  }

  // ── Partido próximo (próximo sábado desde 2026-05-29 = 2026-06-06) ─────────
  const proximoPartido = await prisma.partido.create({
    data: {
      fecha:      new Date("2026-06-06T10:00:00"),
      rival:      "River Plate Baby",
      condicion:  "local",
      campeonato: "Liga Costa de Oro 2026",
      duracion:   100,
      estado:     "pendiente",
    },
  });
  const distProx = distribuirCuartos(jugadoresFichados.map(j=>j.id), 100);
  for (const d of distProx) {
    await prisma.participacionPartido.create({
      data: {
        partidoId: proximoPartido.id,
        jugadorId: d.jugadorId,
        cuartos:   JSON.stringify(d.cuartos),
        minutos:   d.minutos,
      },
    });
  }

  // ── Entrenamientos mayo 2026 ────────────────────────────────────────────────
  const fechasEntrenos = [
    { f:"2026-05-02", hi:"17:30", hf:"19:00", obj:"Trabajo técnico: conducción y control" },
    { f:"2026-05-06", hi:"17:30", hf:"19:00", obj:"Pases cortos y combinaciones" },
    { f:"2026-05-09", hi:"17:30", hf:"19:00", obj:"Definición y remate al arco" },
    { f:"2026-05-13", hi:"17:30", hf:"19:00", obj:"Juego posicional 3-2-1" },
    { f:"2026-05-16", hi:"17:30", hf:"19:00", obj:"Presión alta y recuperación" },
    { f:"2026-05-20", hi:"17:30", hf:"19:00", obj:"Transiciones ataque-defensa" },
    { f:"2026-05-23", hi:"17:30", hf:"19:00", obj:"Trabajo de pelota parada" },
    { f:"2026-05-27", hi:"17:30", hf:"19:00", obj:"Práctica de partido 7v7" },
    // Futuros (junio)
    { f:"2026-06-03", hi:"17:30", hf:"19:00", obj:"Preparación vs River Plate" },
    { f:"2026-06-10", hi:"17:30", hf:"19:00", obj:"Recuperación post-partido" },
    { f:"2026-06-13", hi:"17:30", hf:"19:00", obj:"Táctica: defensa zonal" },
  ];

  const entrenamientos = [];
  for (let i = 0; i < fechasEntrenos.length; i++) {
    const fe = fechasEntrenos[i];
    const e = await prisma.entrenamiento.create({
      data: {
        fecha:       new Date(fe.f + "T17:30:00"),
        hora_inicio: fe.hi,
        hora_fin:    fe.hf,
        lugar:       "Cancha San Luis de Pando",
        entrenador:  "Ernesto",
        objetivo:    fe.obj,
        bloques:     JSON.stringify([
          { nombre:"Entrada en calor", minutos:15, descripcion:"Movilidad articular y rondo 4v1" },
          { nombre:"Bloque técnico",   minutos:20, descripcion:fe.obj },
          { nombre:"Bloque táctico",   minutos:20, descripcion:"Posicionamiento y presión" },
          { nombre:"Juego reducido",   minutos:20, descripcion:"4v4 en espacio reducido" },
          { nombre:"Partido final",    minutos:15, descripcion:"7v7 campo completo" },
        ]),
        materiales:  "Conos, pecheras, balones (6), arcos",
        estado:      i < 8 ? "realizado" : "planificado",
      },
    });
    entrenamientos.push(e);
  }

  // Asistencia para los 8 entrenamientos realizados
  for (let ei = 0; ei < 8; ei++) {
    const entrenamiento = entrenamientos[ei];
    for (let ji = 0; ji < todosJugadores.length; ji++) {
      const jugador = todosJugadores[ji];
      const jugadorKey = ji + 1; // 1-indexed key in ASISTENCIA_PATTERNS
      const presente = ASISTENCIA_PATTERNS[jugadorKey]?.[ei] ?? true;
      await prisma.asistenciaEntrenamiento.create({
        data: {
          entrenamientoId: entrenamiento.id,
          jugadorId: jugador.id,
          estado: presente ? "presente" : "ausente",
        },
      });
    }
  }

  // ── Evaluaciones (marzo y mayo 2026) ───────────────────────────────────────
  for (let i = 0; i < jugadoresFichados.length; i++) {
    const j = jugadoresFichados[i];
    await prisma.evaluacion.create({
      data: {
        jugadorId: j.id,
        fecha:     new Date("2026-03-15"),
        ...EVAL_MARCH[i],
        observaciones: "Evaluación inicial de temporada",
      },
    });
    await prisma.evaluacion.create({
      data: {
        jugadorId: j.id,
        fecha:     new Date("2026-05-15"),
        ...EVAL_MAY[i],
        observaciones: "Evaluación mid-temporada. Progreso notable.",
      },
    });
  }

  console.log(`✓ Seed completo:`);
  console.log(`  - ${jugadoresFichados.length} jugadores fichados`);
  console.log(`  - ${jNoFichados.length} jugadores no fichados`);
  console.log(`  - ${partidosHistoricos.length} partidos históricos + 1 próximo`);
  console.log(`  - ${entrenamientos.length} entrenamientos (8 realizados + 3 planificados)`);
  console.log(`  - ${jugadoresFichados.length * 2} evaluaciones`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
