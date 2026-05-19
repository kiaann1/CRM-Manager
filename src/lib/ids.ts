export const USER_SARAH = 'user-1'
export const USER_MARCUS = 'user-2'
export const USER_ADMIN = 'user-admin'
export const TEAM_SALES = 'team-1'
export const TEAM_CS = 'team-2'
export const WS_MAIN = 'ws-1'
export const PIPE_DEFAULT = 'pipe-1'
export const TERRITORY_WEST = 'ter-1'

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
