import { iniciales } from "@/lib/iniciales";

/** Círculo con las iniciales, borde dorado (mockup: encabezado y Mi perfil). */
export function Iniciales({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border border-dorado text-dorado-oscuro ${
        grande ? "size-14 text-lg" : "size-9 text-sm"
      }`}
    >
      {iniciales(nombre)}
    </span>
  );
}
