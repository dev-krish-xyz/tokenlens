import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace package ships TypeScript source — required for Vercel/Next bundling
  transpilePackages: ['@tokenlens/shared'],
  serverExternalPackages: ['kysely', '@better-auth/kysely-adapter', 'better-auth'],
};

export default config;
