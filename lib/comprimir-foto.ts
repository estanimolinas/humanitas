// Compresión de la foto EN EL CELULAR, antes de subir (R03, regla 9).
// Sin librerías: canvas del navegador. Así una foto de 4 MB sube como menos de 200 KB.

import { MAX_FOTO_BYTES } from "@/lib/validar-publicacion";

export const LADO_MAXIMO = 1280;

/** Escala la foto para que el lado más largo no pase de `maximo`. Función pura, testeable. */
export function dimensionesObjetivo(
  ancho: number,
  alto: number,
  maximo: number = LADO_MAXIMO,
): { ancho: number; alto: number } {
  const lado = Math.max(ancho, alto);
  if (lado <= maximo) return { ancho, alto };
  const factor = maximo / lado;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

/**
 * Devuelve un JPEG de menos de 200 KB. Baja la calidad y, si hace falta, el tamaño,
 * hasta entrar en el presupuesto.
 */
export async function comprimirFoto(archivo: File): Promise<File> {
  const bitmap = await createImageBitmap(archivo);
  let lado = LADO_MAXIMO;

  for (let intento = 0; intento < 4; intento++) {
    const { ancho, alto } = dimensionesObjetivo(bitmap.width, bitmap.height, lado);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext("2d");
    if (!contexto) throw new Error("No se pudo preparar la foto en este celular.");
    contexto.drawImage(bitmap, 0, 0, ancho, alto);

    for (const calidad of [0.7, 0.55, 0.4]) {
      const blob = await new Promise<Blob | null>((listo) =>
        lienzo.toBlob(listo, "image/jpeg", calidad),
      );
      if (blob && blob.size <= MAX_FOTO_BYTES) {
        bitmap.close();
        return new File([blob], "foto.jpg", { type: "image/jpeg" });
      }
    }
    lado = Math.round(lado * 0.7);
  }

  bitmap.close();
  throw new Error("No se pudo reducir esta foto. Podés probar con otra.");
}
