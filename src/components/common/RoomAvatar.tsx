import { UserAvatar } from '@/components/common/UserAvatar'
import { cn } from '@/lib/utils'
import type { Room, User } from '@/types'

const SIZES = {
  sm: 'size-9 text-base',
  md: 'size-12 text-xl',
  lg: 'size-14 text-2xl',
} as const

interface RoomAvatarProps {
  room: Room
  /** DM のときに表示する相手 */
  peer?: User
  size?: keyof typeof SIZES
  className?: string
}

/** グループは絵文字アイコン、DM は相手のアバターを表示する */
export function RoomAvatar({ room, peer, size = 'md', className }: RoomAvatarProps) {
  if (room.kind === 'direct' && peer) {
    return <UserAvatar user={peer} size={size === 'sm' ? 'sm' : 'md'} className={className} />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: `${room.accent}1f`, color: room.accent }}
    >
      {room.icon || '💬'}
    </span>
  )
}
