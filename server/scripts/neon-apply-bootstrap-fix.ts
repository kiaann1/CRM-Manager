/**
 * Apply server/prisma/fix-bootstrap-columns.sql over Neon HTTPS (port 443).
 * Use when `npm run db:push` fails with P1001 (TCP 5432 blocked) but the app can reach Neon.
 * Does NOT drop or reset any data.
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
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
  console.error('This script is for Neon URLs only. For local Postgres use: npm run db:push')
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

async function main() {
  const file = join(serverRoot, 'prisma', 'fix-bootstrap-columns.sql')
  const script = readFileSync(file, 'utf8')
  const statements = splitSql(script)
  console.log(`Applying ${statements.length} statements from fix-bootstrap-columns.sql over Neon HTTPS...`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]!
    try {
      await sql.query(stmt)
      console.log(`  [${i + 1}/${statements.length}] ok`)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === '42P07' || code === '42710') {
        console.log(`  [${i + 1}/${statements.length}] skip (already exists)`)
        continue
      }
      console.error(`Failed on statement ${i + 1}:`, stmt.slice(0, 120))
      throw e
    }
  }

  console.log('Done. Restart the API and sign in again.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
