"use client";

import { useEffect, useState } from "react";

/**
 * Registra el service worker y avisa cuando no hay señal (R13, A2).
 * Es lo único que corre en el navegador además de los formularios.
 */
export function SinConexion() {
  const [sinSenal, setSinSenal] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin service worker la app anda igual: solo se pierde el modo sin conexión.
      });
    }

    const perdio = () => setSinSenal(true);
    const volvio = () => setSinSenal(false);
    window.addEventListener("offline", perdio);
    window.addEventListener("online", volvio);
    if (!navigator.onLine) perdio();

    return () => {
      window.removeEventListener("offline", perdio);
      window.removeEventListener("online", volvio);
    };
  }, []);

  if (!sinSenal) return null;

  return (
    <p role="status" className="aviso rounded-none border-x-0 border-t-0 text-center">
      Sin conexión. Estás viendo lo último que cargaste.
    </p>
  );
}
