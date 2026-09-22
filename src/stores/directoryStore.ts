/** 職員名簿。プロトタイプでは静的だが、管理画面から権限・在籍を変更できる。 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayKey } from '@/lib/demoDay'
import { SEED_REVISION } from '@/mock/seed'
import { safeStorage } from '@/lib/storage'
import { repository } from '@/repositories/hubRepository'
import type { Department, Role, User } from '@/types'

const seed = repository.loadSeed()

interface DirectoryState {
  seededOn: string
  seedRevision: number
  users: User[]
  departments: Department[]
  updateUser: (userId: string, patch: Partial<User>) => void
  setRole: (userId: string, role: Role) => void
  setActive: (userId: string, active: boolean) => void
  resetDemoData: () => void
}

export const useDirectoryStore = create<DirectoryState>()(
  persist(
    (set) => ({
      seededOn: todayKey(),
      seedRevision: SEED_REVISION,
      users: seed.users,
      departments: seed.departments,
      updateUser: (userId, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) })),
      setRole: (userId, role) =>
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)) })),
      setActive: (userId, active) =>
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, active } : u)) })),
      resetDemoData: () => {
        const fresh = repository.loadSeed()
        set({
          seededOn: todayKey(),
          seedRevision: SEED_REVISION,
          users: fresh.users,
          departments: fresh.departments,
        })
      },
    }),
    {
      name: 'hch.directory.v1',
      storage: createJSONStorage(() => safeStorage),
      // 保存データの形を変えたらここを上げる。migrate を置かないので古い保存分は捨てられる
      version: 1,
      // 版が変わったら保存分は捨てる（そのための merge があるので復元はしない）
      migrate: () => undefined as never,
      partialize: (s) => ({ seededOn: s.seededOn, seedRevision: s.seedRevision, users: s.users, departments: s.departments }),
      // 日付が変わったら保存分を捨ててモックを作り直す
      merge: (persisted, current) => {
        const p = persisted as Partial<DirectoryState> | undefined
        // 日付が変わった／モックの版が上がったときは保存分を捨てて作り直す
        if (!p || p.seededOn !== todayKey() || p.seedRevision !== SEED_REVISION) return current
        return { ...current, ...p }
      },
    },
  ),
)

/** 名簿から1人取り出す。見つからないときも落ちないようダミーを返す。 */
export function getUser(userId: string): User {
  const found = useDirectoryStore.getState().users.find((u) => u.id === userId)
  if (found) return found
  return {
    id: userId,
    name: '不明',
    kana: 'ふめい',
    kind: 'human',
    role: 'USER',
    jobTitle: '—',
    department: '—',
    avatarColor: '#717784',
    initials: '？',
    active: false,
  }
}

/** 名前の変更や権限変更に追随させたいときはこちら */
export function useUser(userId: string): User {
  const user = useDirectoryStore((s) => s.users.find((u) => u.id === userId))
  return user ?? getUser(userId)
}

/**
 * 職員（AI・システムの擬似ユーザーを除く）。
 * 呼ぶたびに新しい配列を返すと、依存配列に入れたときに毎回発火するので memo する。
 */
export function useStaff(): User[] {
  const users = useDirectoryStore((s) => s.users)
  return useMemo(() => users.filter((u) => u.kind === 'human'), [users])
}
