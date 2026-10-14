import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Next.js only reads .env from packages/app; the monorepo keeps one .env at the root.
loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // MikroORM loads drivers and extensions dynamically; keep it out of the bundle.
  // @mikro-orm/core and pg are already in Next's built-in external list.
  serverExternalPackages: [
    "@mikro-orm/postgresql",
    "@mikro-orm/sql",
    "@mikro-orm/migrations",
    "kysely",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
