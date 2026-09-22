import { cn } from '@/lib/utils'
import type { User } from '@/types'

const SIZES = {
  xs: 'size-7 text-[11px]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const

export type AvatarSize = keyof typeof SIZES

interface UserAvatarProps {
  user: User
  size?: AvatarSize
  className?: string
}

/**
 * 職員アバター。画像は持たないので、色つきの円＋イニシャルで表す。
 * AI は人間と混同させないため、専用の見た目にする（設計書 §13）。
 */
export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const isAi = user.kind === 'ai'
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        isAi && 'bg-ai ring-2 ring-ai-border',
        className,
      )}
      style={isAi ? undefined : { backgroundColor: user.avatarColor }}
    >
      {isAi ? '🤖' : user.kind === 'system' ? '🔔' : user.initials}
    </span>
  )
}
