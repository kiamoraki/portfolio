import type { NextConfig } from "next";
import { getLegacyRedirects } from "./lib/projects";

const config: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  async redirects() {
    return getLegacyRedirects();
  },
};

export default config;
