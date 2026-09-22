/**
 * 職員IDから職員を引くための小さなフック。
 * 表の中で何度も名前に変換するので、毎回 find せずに Map を作って使う。
 */
import { useCallback, useMemo } from 'react'
import { getUser, useDirectoryStore } from '@/stores/directoryStore'
import type { User } from '@/types'

export function useUserLookup(): (userId: string) => User {
  const users = useDirectoryStore((s) => s.users)
  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  // 名簿に無いIDでも落ちないよう、getUser のダミーへ落とす
  return useCallback((userId: string) => byId.get(userId) ?? getUser(userId), [byId])
}
