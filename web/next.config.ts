import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ['kysely', '@better-auth/kysely-adapter', 'better-auth'],
};

export default config;
