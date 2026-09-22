import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { getUser } from '@/stores/directoryStore'
import { useChatStore } from '@/stores/chatStore'
import type { Room } from '@/types'

interface MemberSheetProps {
  room: Room | null
  meId: string
  onOpenChange: (open: boolean) => void
}

/** グループのメンバー一覧。DM 開始の導線も置く。 */
export function MemberSheet({ room, meId, onOpenChange }: MemberSheetProps) {
  const navigate = useNavigate()
  const createDirectRoom = useChatStore((s) => s.createDirectRoom)
  if (!room) return null

  return (
    <Sheet open={!!room} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {room.icon} {room.name} のメンバー
          </SheetTitle>
          <SheetDescription>{room.memberIds.length} 人が参加しています</SheetDescription>
        </SheetHeader>
        <ul className="px-4 pb-6">
          {room.memberIds.map((id) => {
            const user = getUser(id)
            const isAdmin = room.adminIds.includes(id)
            return (
              <li key={id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                <UserAvatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name}
                    {id === meId && <span className="ml-1 text-xs text-muted-foreground">（自分）</span>}
                    {isAdmin && (
                      <span className="ml-1.5 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        管理者
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.department}・{user.jobTitle}
                    {user.extension ? `・内線 ${user.extension}` : ''}
                  </p>
                </div>
                {id !== meId && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${user.name} と個人チャットを開く`}
                    onClick={() => {
                      const roomId = createDirectRoom(id)
                      onOpenChange(false)
                      navigate(`/chat/${roomId}`)
                    }}
                  >
                    <MessageSquare className="size-4" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
