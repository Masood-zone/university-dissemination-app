import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const globalForPg = global as unknown as { pgPool?: Pool };

const directUrl = process.env.DIRECT_URL;
const accelerateUrl = process.env.ACCELERATE_URL ?? process.env.DATABASE_URL;

function createPrismaClient() {
  const logLevels =
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const);

  if (directUrl && !directUrl.startsWith("prisma+")) {
    const pool =
      globalForPg.pgPool ||
      new Pool({
        connectionString: directUrl,
      });

    if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: [...logLevels] });
  }

  if (!accelerateUrl) {
    throw new Error(
      "Missing database configuration. Set DIRECT_URL (recommended for local/dev) or DATABASE_URL/ACCELERATE_URL (Prisma Accelerate).",
    );
  }

  return new PrismaClient({ accelerateUrl, log: [...logLevels] });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
