export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import NotasClient from "./NotasClient";

export default async function NotasPage() {
  const notas = await prisma.nota.findMany({
    orderBy: { creado_en: "desc" },
  });
  return <NotasClient notasIniciales={JSON.parse(JSON.stringify(notas))} />;
}
