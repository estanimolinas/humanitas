import type { MetadataRoute } from "next";

// PWA (12.1): se agrega a la pantalla de inicio sin pasar por ninguna tienda. Sin push.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Humanitas",
    short_name: "Humanitas",
    description: "Tecnología al servicio de la humanidad",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f2f2",
    theme_color: "#f3f2f2",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
