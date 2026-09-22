import { useEffect, useState } from 'react'
import { ChatRoom } from '@/features/chat/components/ChatRoom'
import { useChatStore, useRoom } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * マイルーム（設計指示 §11）。通常のチャットと同じUIで、自分だけが見られる。
 * 利用者を切り替えても他人のマイルームが見えないよう、自分のものを取得（無ければ作成）する。
 */
export function MyRoomPage() {
  const meId = useSessionStore((s) => s.currentUserId)
  const ensureMyRoom = useChatStore((s) => s.ensureMyRoom)
  const [roomId, setRoomId] = useState<string | null>(null)
  const room = useRoom(roomId ?? undefined)

  useEffect(() => {
    setRoomId(ensureMyRoom())
  }, [meId, ensureMyRoom])

  if (!room) return null

  return (
    <div className="flex h-full">
      <ChatRoom key={room.id} room={room} />
    </div>
  )
}
