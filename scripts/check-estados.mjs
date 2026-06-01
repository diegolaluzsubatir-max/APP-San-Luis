import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const rows = await prisma.entrenamiento.findMany({
  orderBy: { fecha: "asc" },
  select: { id: true, fecha: true, estado: true, suspendido: true, asistencias: { select: { id: true } } },
});

console.log("\nid  | fecha       | estado      | suspendido | asistencias");
console.log("----|-------------|-------------|------------|-----------");
for (const r of rows) {
  const fecha = r.fecha.toISOString().slice(0, 10);
  console.log(
    `${String(r.id).padEnd(3)} | ${fecha} | ${r.estado.padEnd(11)} | ${String(r.suspendido).padEnd(10)} | ${r.asistencias.length}`
  );
}

await prisma.$disconnect();
