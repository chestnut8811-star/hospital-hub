import { MessageSquareX } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ChatRoom } from '@/features/chat/components/ChatRoom'
import { RoomListPane } from '@/features/chat/components/RoomListPane'
import { useRoom } from '@/stores/chatStore'

/** チャット画面。PC では一覧を左に並べる2ペイン、スマホは全画面。 */
export function ChatPage() {
  const { roomId } = useParams()
  const room = useRoom(roomId)
  const navigate = useNavigate()

  if (!room) {
    return (
      <div className="h-full overflow-y-auto">
        <EmptyState
          icon={MessageSquareX}
          title="チャットが見つかりません"
          description="削除されたか、退出した可能性があります。"
          action={<Button onClick={() => navigate('/groups')}>グループ一覧へ</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {room.kind !== 'myroom' && (
        <RoomListPane
          kind={room.kind}
          title={room.kind === 'group' ? 'グループ' : '個人'}
          activeRoomId={room.id}
          className="hidden w-[380px] shrink-0 border-r lg:flex"
        />
      )}
      {/* ルームが変わったら入力中の状態を初期化するため key を付ける */}
      <ChatRoom key={room.id} room={room} />
    </div>
  )
}
