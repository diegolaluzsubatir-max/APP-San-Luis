import { prisma } from "@/lib/prisma";
import InformesClient from "./InformesClient";

export default async function InformesPage() {
  const jugadores = await prisma.jugador.findMany({
    where: { fichado: true },
    orderBy: [{ numero_camiseta: "asc" }],
    select: { id: true, nombre: true, apellido: true, numero_camiseta: true },
  });

  return (
    <div className="max-w-2xl">
      <InformesClient jugadores={jugadores} />
    </div>
  );
}
