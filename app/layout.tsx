import type { Metadata, Viewport } from "next";
import { BarraInferior } from "./componentes/BarraInferior";
import { Encabezado } from "./componentes/Encabezado";
import { SinConexion } from "./componentes/SinConexion";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humanitas",
  description: "La app del barrio: quien ofrece trabajo y quien quiere trabajar se encuentran.",
};

// Color de la barra del navegador en el celular y sin zoom forzado.
export const viewport: Viewport = {
  themeColor: "#f3f2f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SinConexion />
        <Encabezado />
        {children}
        <BarraInferior />
      </body>
    </html>
  );
}
