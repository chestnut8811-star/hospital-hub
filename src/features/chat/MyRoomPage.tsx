import { NotebookPen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ChatRoom } from '@/features/chat/components/ChatRoom'
import { useRoom } from '@/stores/chatStore'
import { MY_ROOM_ID } from '@/types'

/** マイルーム（設計書 §11）。通常のチャットと同じUIで、自分だけが見られる。 */
export function MyRoomPage() {
  const room = useRoom(MY_ROOM_ID)
  const navigate = useNavigate()

  if (!room) {
    return (
      <div className="h-full overflow-y-auto">
        <EmptyState
          icon={NotebookPen}
          title="マイルームがありません"
          description="デモデータを初期化すると復活します。"
          action={<Button onClick={() => navigate('/menu')}>メニューへ戻る</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <ChatRoom key={room.id} room={room} />
    </div>
  )
}
