import type { NextConfig } from "next";
import { CABECERAS_FIJAS } from "./lib/seguridad/cabeceras";

const nextConfig: NextConfig = {
  // No anunciar con qué está hecha la app.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_FIJAS }];
  },
};

export default nextConfig;
