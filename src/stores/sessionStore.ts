/** ログイン状態。プロトタイプなので認証はせず、利用者を選ぶだけ。 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'
import { DEFAULT_USER_ID } from '@/repositories/hubRepository'
import { getUser, useDirectoryStore } from '@/stores/directoryStore'
import type { Role, User } from '@/types'
import { hasRole } from '@/types'

interface SessionState {
  currentUserId: string
  isAuthenticated: boolean
  login: (userId: string) => void
  logout: () => void
  /** 権限ごとの見え方を確認するための切り替え（デモ用） */
  switchUser: (userId: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentUserId: DEFAULT_USER_ID,
      isAuthenticated: false,
      login: (userId) => set({ currentUserId: userId, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      switchUser: (userId) => set({ currentUserId: userId }),
    }),
    {
      name: 'hch.session.v1',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
)

/** 現在ログインしている職員 */
export function useCurrentUser(): User {
  const id = useSessionStore((s) => s.currentUserId)
  const user = useDirectoryStore((s) => s.users.find((u) => u.id === id))
  return user ?? getUser(id)
}

/** 非リアクティブに現在の利用者IDを取る（ストアのアクション内で使う） */
export function currentUserId(): string {
  return useSessionStore.getState().currentUserId
}

/** 指定した権限以上かどうか */
export function useHasRole(required: Role): boolean {
  const user = useCurrentUser()
  return hasRole(user.role, required)
}
