// Re-export Prisma Client for use in other packages
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Export singleton instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
