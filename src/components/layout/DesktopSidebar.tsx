import { NavLink } from 'react-router-dom'
import { UnreadBadge } from '@/components/common/UnreadBadge'
import { UserAvatar } from '@/components/common/UserAvatar'
import { SIDEBAR_SECTIONS } from '@/lib/navigation'
import type { BadgeKind } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useTotalUnread } from '@/stores/chatStore'
import {
  useActiveDrill,
  useOpenSurveyCount,
  useOpenTroubleCount,
  useUnreadAnnouncementCount,
} from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { ROLE_LABEL, hasRole } from '@/types'

/** PC（lg 以上）の左サイドバー。スマホでは下部ナビが同じ役割を持つ。 */
export function DesktopSidebar({ className }: { className?: string }) {
  const me = useCurrentUser()
  const groupUnread = useTotalUnread('group')
  const directUnread = useTotalUnread('direct')
  const announcements = useUnreadAnnouncementCount(me.id, me.department)
  const troubles = useOpenTroubleCount()
  const surveys = useOpenSurveyCount()
  const drill = useActiveDrill()
  const answered = drill?.responses.some((r) => r.userId === me.id) ?? true

  const badgeCount = (badge?: BadgeKind): number => {
    switch (badge) {
      case 'announcements':
        return announcements
      case 'troubles':
        return troubles
      case 'surveys':
        return surveys
      case 'safety':
        return drill && !answered ? 1 : 0
      default:
        return 0
    }
  }

  return (
    <aside
      className={cn(
        'w-[280px] shrink-0 flex-col border-r border-border bg-sidebar',
        className,
      )}
      aria-label="サイドバー"
    >
      <div className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4">
        {SIDEBAR_SECTIONS.map((section) => {
          const items = section.items.filter((item) => hasRole(me.role, item.minRole))
          if (items.length === 0) return null
          return (
            <div key={section.title} className="mb-5">
              <p className="px-2 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const count =
                    item.id === 'groups'
                      ? groupUnread
                      : item.id === 'direct'
                        ? directUnread
                        : badgeCount(item.badge)
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-foreground hover:bg-muted',
                          )
                        }
                      >
                        <Icon className="size-[18px] shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <UnreadBadge count={count} />
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
        <UserAvatar user={me} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{me.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {me.department}・{ROLE_LABEL[me.role]}
          </p>
        </div>
      </div>
    </aside>
  )
}
