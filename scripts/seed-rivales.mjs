import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.rival.deleteMany({})

  const rivales = [
    'Albatros',
    'Atlanta Jr',
    'Atlántida Verde',
    'Atlántida Juniors',
    'La Floresta',
    'Huracán del Pinar',
    'Parque del Plata',
    'Escuela La Costa',
    'Progreso',
    'Neptunia Country Club',
    'Unidos Podemos',
    'Academia Forlán',
    'Unión de Empalme Olmos',
  ]

  for (const nombre of rivales) {
    await prisma.rival.create({ data: { nombre } })
  }

  console.log('Rivales cargados:', rivales.length)
  await prisma.$disconnect()
}
main()
