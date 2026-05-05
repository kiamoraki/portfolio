import type { NextConfig } from "next";

const config: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  output: "export",
  // Static export has no image optimization service. Sources were already
  // pre-compressed by scripts/optimize-images.mjs; the browser loads them as-is.
  images: { unoptimized: true },
  // Static export emits trailing-slash directory URLs (/projects/tobrit/index.html)
  // which match Nginx default behavior. Set to true if your host serves /projects/tobrit
  // -> /projects/tobrit/index.html automatically (most do).
  trailingSlash: true,
};

export default config;
