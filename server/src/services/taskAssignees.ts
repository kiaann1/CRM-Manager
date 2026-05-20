import { prisma } from '../lib/prisma.js'

function isSchemaDrift(err: unknown): boolean {
  const code = (err as { code?: string })?.code
  return code === 'P2022' || code === 'P2021'
}

function taskAssigneeDelegate():
  | {
      findMany: typeof prisma.taskAssignee.findMany
      deleteMany: typeof prisma.taskAssignee.deleteMany
      createMany: typeof prisma.taskAssignee.createMany
    }
  | undefined {
  const delegate = (prisma as { taskAssignee?: typeof prisma.taskAssignee }).taskAssignee
  if (!delegate?.findMany) return undefined
  return delegate
}

export async function memberUserIds(orgId: string, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return []
  const unique = [...new Set(userIds)]
  const rows = await prisma.membership.findMany({
    where: { organizationId: orgId, userId: { in: unique } },
    select: { userId: true },
  })
  const allowed = new Set(rows.map((r) => r.userId))
  return unique.filter((id) => allowed.has(id))
}

export async function syncTaskAssignees(
  taskId: string,
  orgId: string,
  assigneeIds: string[],
): Promise<string[]> {
  const valid = await memberUserIds(orgId, assigneeIds)
  const delegate = taskAssigneeDelegate()
  if (!delegate) {
    console.warn(
      '[tasks] TaskAssignee client unavailable — run: npm run db:push --prefix server (or patch-latest.sql in Neon)',
    )
    return valid
  }
  try {
    await delegate.deleteMany({ where: { taskId } })
    if (valid.length > 0) {
      await delegate.createMany({
        data: valid.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      })
    }
  } catch (err) {
    if (!isSchemaDrift(err)) console.warn('[tasks] assignee sync failed:', err)
    return valid
  }
  return valid
}

export async function loadAssigneesByTaskId(
  orgId: string,
): Promise<Map<string, string[]>> {
  const delegate = taskAssigneeDelegate()
  if (!delegate) return new Map()

  try {
    const rows = await delegate.findMany({
      where: { task: { organizationId: orgId } },
      select: { taskId: true, userId: true },
    })
    const map = new Map<string, string[]>()
    for (const row of rows) {
      const list = map.get(row.taskId) ?? []
      list.push(row.userId)
      map.set(row.taskId, list)
    }
    return map
  } catch (err) {
    if (!isSchemaDrift(err)) console.warn('[tasks] assignee load failed:', err)
    return new Map()
  }
}
