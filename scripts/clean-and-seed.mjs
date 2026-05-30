import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando base de datos...')

  // Limpiar en orden por dependencias
  await prisma.participacionPartido.deleteMany({})
  await prisma.asistenciaEntrenamiento.deleteMany({})
  await prisma.partido.deleteMany({})
  await prisma.entrenamiento.deleteMany({})

  console.log('OK - tablas vaciadas')

  // Cargar entrenamientos reales
  // Nota: campo es "entrenador" (no "coach"), sin categoriaId en este schema
  await prisma.entrenamiento.create({
    data: {
      fecha:       new Date('2026-05-26T17:30:00'),
      hora_inicio: '17:30',
      hora_fin:    '18:30',
      lugar:       'Cancha San Luis de Pando',
      objetivo:    'Entrenamiento',
      entrenador:  'Ernesto Fontes',
      estado:      'realizado',
    }
  })

  await prisma.entrenamiento.create({
    data: {
      fecha:       new Date('2026-05-28T17:30:00'),
      hora_inicio: '17:30',
      hora_fin:    '18:30',
      lugar:       'Cancha San Luis de Pando',
      objetivo:    'Amistoso (cuenta como entrenamiento)',
      entrenador:  'Ernesto Fontes',
      estado:      'realizado',
    }
  })

  await prisma.entrenamiento.create({
    data: {
      fecha:       new Date('2026-05-30T10:00:00'),
      hora_inicio: '10:00',
      hora_fin:    '11:00',
      lugar:       'Cancha San Luis de Pando',
      objetivo:    'Entrenamiento',
      entrenador:  'Ernesto Fontes',
      estado:      'planificado',
    }
  })

  console.log('Listo - 3 entrenamientos cargados, partidos vacíos')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
