import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { BarraInferior } from "./componentes/BarraInferior";
import { Encabezado } from "./componentes/Encabezado";
import { SinConexion } from "./componentes/SinConexion";
import "./globals.css";

// Lexend: pensada para leer con fluidez. next/font la descarga en el build y la sirve
// desde nuestro dominio: el navegador nunca le pide nada a Google.
const lexend = Lexend({ subsets: ["latin"], display: "swap", variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "Humanitas",
  description: "Tecnología al servicio de la humanidad",
};

// Color de la barra del navegador en el celular y sin zoom forzado.
export const viewport: Viewport = {
  themeColor: "#f3f2f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${lexend.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SinConexion />
        <Encabezado />
        {children}
        <BarraInferior />
      </body>
    </html>
  );
}
