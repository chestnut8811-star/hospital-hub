import { NavLink } from 'react-router-dom'
import { UnreadBadge } from '@/components/common/UnreadBadge'
import { BOTTOM_TABS } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useTotalUnread } from '@/stores/chatStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { useUnreadAnnouncementCount } from '@/stores/hubStore'

/** スマホ・タブレットの下部ナビゲーション（設計指示 §3） */
export function BottomNav({ className }: { className?: string }) {
  const groupUnread = useTotalUnread('group')
  const directUnread = useTotalUnread('direct')
  const me = useCurrentUser()
  const announcementUnread = useUnreadAnnouncementCount(me.id, me.department)
  const counts: Record<string, number> = {
    groups: groupUnread,
    direct: directUnread,
    menu: announcementUnread,
  }

  return (
    <nav
      className={cn(
        'z-30 shrink-0 border-t border-border bg-card pb-safe',
        className,
      )}
      aria-label="メインナビゲーション"
    >
      <ul className="flex">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon
          const count = counts[tab.id] ?? 0
          return (
            <li key={tab.id} className="flex-1">
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-16 flex-col items-center justify-center gap-0.5 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                      {count > 0 && (
                        <UnreadBadge
                          count={count}
                          className="absolute -top-1.5 -right-2.5"
                        />
                      )}
                    </span>
                    {tab.label}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
