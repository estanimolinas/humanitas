import type { Metadata } from "next";
import { Encabezado } from "./componentes/Encabezado";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humanitas",
  description: "La app del barrio: quien ofrece trabajo y quien quiere trabajar se encuentran.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Encabezado />
        {children}
      </body>
    </html>
  );
}
