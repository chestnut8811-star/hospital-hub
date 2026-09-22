import { User } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { RoomListPane } from '@/features/chat/components/RoomListPane'

/** 個人チャット一覧（ボトムナビ タブ2） */
export function DirectListPage() {
  return (
    <div className="flex h-full">
      <RoomListPane kind="direct" title="個人" className="min-w-0 flex-1 lg:max-w-[380px] lg:border-r" />
      <div className="hidden flex-1 items-center justify-center bg-surface-sunken lg:flex">
        <EmptyState
          icon={User}
          title="相手を選んでください"
          description="左の一覧から選ぶと、ここに会話が表示されます。"
        />
      </div>
    </div>
  )
}
