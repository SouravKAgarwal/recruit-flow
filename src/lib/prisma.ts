import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { encryptionExtension } from "./crypto-extension";
import { getSession } from "./session";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Initialize Prisma
const basePrisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

// Extension for Row Level Security + Encryption
export const prismaWithRLS = basePrisma.$extends(encryptionExtension).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Only apply RLS if we're in a context where cookies() is available
        // Next.js throws if cookies() is called outside request context, so we catch it
        let userId: string | null = null;
        try {
          const session = await getSession();
          if (session?.userId) {
            userId = session.userId;
          }
        } catch {
          // Ignore, we are likely in a script or static generation context
        }

        if (userId) {
          // Wrap every query in a transaction that sets the user ID for RLS
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, TRUE)`, userId),
            query(args),
          ]);
          return result;
        }

        // If no user ID, just run the query (for public operations like login/register)
        return query(args);
      },
    },
  },
});

export default prismaWithRLS;
