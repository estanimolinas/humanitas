"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de un formulario que, mientras espera al servidor, dice qué está pasando y no se puede
 * tocar de nuevo (con señal lenta la gente toca varias veces).
 */
export function BotonEnviar({
  children,
  enviando,
  className = "boton-principal",
}: {
  children: React.ReactNode;
  enviando: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? enviando : children}
    </button>
  );
}
