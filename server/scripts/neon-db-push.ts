/**
 * Apply Prisma schema when TCP port 5432 is blocked (school/corp networks).
 * Uses Neon serverless driver over HTTPS/WebSocket (port 443).
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverRoot = join(__dirname, '..')
const url = process.env.DATABASE_URL

if (!url) {
  console.error('DATABASE_URL is missing in server/.env')
  process.exit(1)
}

if (!url.includes('neon.tech')) {
  console.error('neon-db-push is for Neon URLs only. For local Postgres use: npm run db:push')
  process.exit(1)
}

const sql = neon(url)

function splitSql(script: string): string[] {
  return script
    .split(/^--.*$/gm)
    .join('\n')
    .split(/;\s*(\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function resetSchema() {
  console.log('Resetting public schema (fixes partial failed runs)...')
  await sql.query('DROP SCHEMA IF EXISTS public CASCADE')
  await sql.query('CREATE SCHEMA public')
  await sql.query('GRANT ALL ON SCHEMA public TO public')
  await sql.query('GRANT ALL ON SCHEMA public TO neondb_owner')
}

async function main() {
  if (process.env.NEON_RESET !== '0') {
    await resetSchema()
  }

  console.log('Generating SQL from Prisma schema...')
  const script = execSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    { cwd: serverRoot, encoding: 'utf8' },
  )

  const statements = splitSql(script)
  console.log(`Applying ${statements.length} statements over Neon HTTP...`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]!
    try {
      await sql.query(stmt)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === '42P07' || code === '42710') {
        console.log(`  [${i + 1}/${statements.length}] skip (exists)`)
        continue
      }
      console.error(`Failed on statement ${i + 1}:`, stmt.slice(0, 120), '...')
      throw e
    }
    if ((i + 1) % 20 === 0 || i === statements.length - 1) {
      console.log(`  [${i + 1}/${statements.length}] ok`)
    }
  }

  console.log('Schema applied.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
