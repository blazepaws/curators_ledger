import { PrismaClient } from "@prisma/client"
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

declare global {
  // allow global prisma in dev to avoid socket exhaustion
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({ adapter })
if (process.env.NODE_ENV !== "production") global.prisma = prisma

export default prisma
