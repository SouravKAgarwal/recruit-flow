import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { encryptionExtension } from "./crypto-extension";
import { getSession } from "./session";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const basePrisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

import { Prisma } from "@prisma/client";

const prismaWithRLS = basePrisma.$extends(encryptionExtension).$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }: any) {
        let userId: string | null = null;
        try {
          const session = await getSession();
          if (session?.user?.id) {
            userId = session.user.id;
          }
        } catch {}

        if (userId) {
          const [, result] = await basePrisma.$transaction(
            [
              basePrisma.$executeRawUnsafe(
                `SELECT set_config('app.current_user_id', $1, TRUE)`,
                userId,
              ),
              query(args) as Prisma.PrismaPromise<any>,
            ],
            { maxWait: 15000, timeout: 15000 },
          );
          return result;
        }

        return query(args);
      },
    },
  },
} as any);

export default prismaWithRLS as unknown as typeof basePrisma;
