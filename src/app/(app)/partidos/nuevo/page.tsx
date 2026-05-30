export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NuevoPartidoClient from "./NuevoPartidoClient";

export default async function NuevoPartidoPage() {
  const rivales = await prisma.rival.findMany({ orderBy: { nombre: "asc" } });
  return (
    <div className="max-w-lg space-y-4">
      <Link href="/partidos" className="text-sm text-[#0047AB] hover:underline">← Volver</Link>
      <h2 className="font-bold text-gray-800">Nuevo partido</h2>
      <NuevoPartidoClient rivales={JSON.parse(JSON.stringify(rivales))} />
    </div>
  );
}
