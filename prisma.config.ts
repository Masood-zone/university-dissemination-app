import "dotenv/config";

import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error(
    "Missing database URL. Set DIRECT_URL (recommended for Prisma CLI) or DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
