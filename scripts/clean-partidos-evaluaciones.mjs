import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Borrar en orden por dependencias
  await prisma.participacionPartido.deleteMany({})
  await prisma.partido.deleteMany({})
  await prisma.evaluacion.deleteMany({})

  // Verificar jugadores intactos
  const jugadores = await prisma.jugador.count()
  const entrenamientos = await prisma.entrenamiento.count()
  console.log(`Jugadores: ${jugadores} (intactos)`)
  console.log(`Entrenamientos: ${entrenamientos} (intactos)`)
  console.log('Partidos y evaluaciones borrados correctamente')

  await prisma.$disconnect()
}
main()
