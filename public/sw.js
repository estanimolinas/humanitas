// Service worker de Humanitas (R13). Escrito a mano: sin librerías, unos 2 KB.
// Guarda los archivos de la app y la última lista que se vio, para que con mala señal
// igual se pueda mirar. No guarda nada que dependa de la sesión. Sin push.

const VERSION = "humanitas-v1";

// Nunca se guardan: dependen de quién sos o cambian datos.
const PRIVADAS = ["/api", "/alta", "/publicar", "/mis-publicaciones"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (PRIVADAS.some((p) => url.pathname.startsWith(p))) return;

  // Archivos de la app: del cache primero, que es lo más rápido y barato en datos.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icono-")) {
    evento.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const guardado = await cache.match(pedido);
        if (guardado) return guardado;
        const respuesta = await fetch(pedido);
        if (respuesta.ok) cache.put(pedido, respuesta.clone());
        return respuesta;
      }),
    );
    return;
  }

  // Pantallas: primero la red, para ver lo último. Si no hay señal, lo último que se cargó.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      (async () => {
        try {
          const respuesta = await fetch(pedido);
          if (respuesta.ok) {
            const cache = await caches.open(VERSION);
            cache.put(pedido, respuesta.clone());
          }
          return respuesta;
        } catch {
          const cache = await caches.open(VERSION);
          const guardada = (await cache.match(pedido)) || (await cache.match("/"));
          if (guardada) return guardada;
          return new Response(
            "<!doctype html><meta charset='utf-8'><p style='font:16px system-ui;padding:20px'>" +
              "Sin conexión. Abrí la app cuando tengas señal.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
  }
});
