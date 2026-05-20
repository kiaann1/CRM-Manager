/**
 * Apply TaskAssignee table only (Neon HTTPS). Safe when full db:fix:bootstrap fails on DO $$ blocks.
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url?.includes('neon.tech')) {
  console.error('Set DATABASE_URL to your Neon connection string in server/.env')
  process.exit(1)
}

const sql = neon(url)

const statements = [
  `CREATE TABLE IF NOT EXISTS "TaskAssignee" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("taskId", "userId")
  )`,
  `CREATE INDEX IF NOT EXISTS "TaskAssignee_userId_idx" ON "TaskAssignee" ("userId")`,
  `INSERT INTO "TaskAssignee" ("taskId", "userId")
   SELECT t.id, t."ownerId" FROM "Task" t
   WHERE NOT EXISTS (
     SELECT 1 FROM "TaskAssignee" ta WHERE ta."taskId" = t.id
   )`,
]

async function main() {
  for (let i = 0; i < statements.length; i++) {
    await sql.query(statements[i]!)
    console.log(`[${i + 1}/${statements.length}] ok`)
  }
  console.log('TaskAssignee patch applied.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
