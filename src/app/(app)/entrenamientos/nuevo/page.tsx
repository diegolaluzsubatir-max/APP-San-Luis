import Link from "next/link";
import NuevoEntrenamientoClient from "./NuevoEntrenamientoClient";

export default function NuevoEntrenamientoPage() {
  return (
    <div className="max-w-lg space-y-4">
      <Link href="/entrenamientos" className="text-sm text-[#0047AB] hover:underline">← Volver</Link>
      <h2 className="font-bold text-gray-800">Nuevo entrenamiento</h2>
      <NuevoEntrenamientoClient />
    </div>
  );
}
