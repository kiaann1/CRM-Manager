import { prisma } from './prisma.js'

export type InboxDbRow = {
  id: string
  organizationId: string
  teamId: string | null
  senderId: string | null
  recipientUserId: string | null
  from: string
  subject: string
  body: string
  read: boolean
  readByUserIds: unknown
  receivedAt: Date
}

/** Load inbox rows; falls back to legacy SQL when new columns are not migrated yet. */
export async function loadInboxForOrg(organizationId: string): Promise<InboxDbRow[]> {
  try {
    return await prisma.inboxMessage.findMany({
      where: { organizationId },
      orderBy: { receivedAt: 'desc' },
      take: 200,
    })
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code !== 'P2022') throw err
    console.warn(
      '[inbox] Legacy schema detected — using SQL fallback. Run: npm run db:push --prefix server',
    )
    const legacy = await prisma.$queryRaw<
      {
        id: string
        organizationId: string
        teamId: string
        from: string
        subject: string
        body: string
        read: boolean
        receivedAt: Date
      }[]
    >`
      SELECT id, "organizationId", "teamId", "from", subject, body, read, "receivedAt"
      FROM "InboxMessage"
      WHERE "organizationId" = ${organizationId}
      ORDER BY "receivedAt" DESC
      LIMIT 200
    `
    return legacy.map((m) => ({
      ...m,
      teamId: m.teamId ?? null,
      senderId: null,
      recipientUserId: null,
      readByUserIds: [],
    }))
  }
}

export function readByUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((id): id is string => typeof id === 'string')
}

export function isInboxReadForUser(
  msg: { read: boolean; readByUserIds: unknown; senderId: string | null },
  userId: string,
): boolean {
  if (readByUserIds(msg.readByUserIds).includes(userId)) return true
  if (!msg.senderId && msg.read) return true
  return false
}
