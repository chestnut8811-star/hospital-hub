/**
 * データ取得の入口。
 *
 * Phase 1 はモックのみ。Phase 3 で Supabase／院内 PocketBase に差し替えるときは、
 * この interface を満たす実装を足して `repository` を入れ替える。
 * 画面は必ずストア経由でデータに触り、`src/data/*.json` を直接 import しない。
 */
import { createSeed, DEFAULT_USER_ID } from '@/mock/seed'
import type { SeedData } from '@/mock/seed'

export interface HubRepository {
  /** 初期データ一式を返す */
  loadSeed(viewerId?: string): SeedData
}

const mockRepository: HubRepository = {
  loadSeed(viewerId = DEFAULT_USER_ID) {
    return createSeed(viewerId)
  },
}

export const repository: HubRepository = mockRepository
export { DEFAULT_USER_ID }
