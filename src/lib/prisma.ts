import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";

let connectionString = `${process.env.DATABASE_URL}`;

if (connectionString.startsWith("file:")) {
  const dbPath = connectionString.replace("file:", "");
  connectionString = `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbPath)}`;
}

const adapter = new PrismaBetterSqlite3({ url: connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
