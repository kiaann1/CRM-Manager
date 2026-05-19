import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import { config as loadEnv } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ws from 'ws'

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
loadEnv({ path: join(serverRoot, '.env') })

/** Use Neon serverless driver when host is neon.tech (works when port 5432 is blocked). */
export function createPrisma() {
  const url = process.env.DATABASE_URL ?? ''
  if (url.includes('neon.tech')) {
    neonConfig.webSocketConstructor = ws
    const adapter = new PrismaNeon({ connectionString: url })
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}
