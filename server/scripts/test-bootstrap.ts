import { buildBootstrap } from '../src/services/bootstrap.js'
import { prisma } from '../src/lib/prisma.js'

const user = await prisma.user.findUnique({
  where: { email: 'admin@crm.local' },
  include: { memberships: true },
})
if (!user?.memberships[0]) {
  console.error('User or membership not found — run npm run db:seed --prefix server')
  process.exit(1)
}
try {
  await buildBootstrap(user.memberships[0].organizationId, user.id)
  console.log('bootstrap ok')
} catch (e) {
  console.error('bootstrap failed:', e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
