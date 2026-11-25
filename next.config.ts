import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Uploaded brand images (public/brand/*.png) are listed once, at build time, so that
// components can choose between an uploaded image and its SVG fallback without touching
// the file system at request time (public/ is not readable inside a serverless function).
const brandDir = path.join(process.cwd(), "public", "brand");
const brandFiles = fs.existsSync(brandDir)
  ? fs
      .readdirSync(brandDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.slice(0, -4))
  : [];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BRAND_FILES: brandFiles.join(","),
    // ADAPTER_MODE is the switch the runner sets; this mirror lets client code read it.
    NEXT_PUBLIC_ADAPTER_MODE: process.env.ADAPTER_MODE ?? "fake",
  },
};

export default nextConfig;
