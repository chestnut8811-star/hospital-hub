/** 画面をまたいで共有する一時的なUI状態。永続化しない。 */
import { create } from 'zustand'

interface UiState {
  /** ヘッダーの検索ダイアログ */
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  /** AI要約モーダル（開いているルームID。null で閉じる） */
  aiSummaryRoomId: string | null
  setAiSummaryRoomId: (roomId: string | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  aiSummaryRoomId: null,
  setAiSummaryRoomId: (aiSummaryRoomId) => set({ aiSummaryRoomId }),
}))
