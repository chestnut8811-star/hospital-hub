import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { RoomListPane } from '@/features/chat/components/RoomListPane'

/** グループ一覧（ボトムナビ タブ1）。PC では右にチャットを並べる2ペイン。 */
export function GroupListPage() {
  return (
    <div className="flex h-full">
      <RoomListPane kind="group" title="グループ" className="min-w-0 flex-1 lg:max-w-[380px] lg:border-r" />
      <div className="hidden flex-1 items-center justify-center bg-surface-sunken lg:flex">
        <EmptyState
          icon={MessageSquare}
          title="チャットを選んでください"
          description="左の一覧からグループを選ぶと、ここに会話が表示されます。"
        />
      </div>
    </div>
  )
}
