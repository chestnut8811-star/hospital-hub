/**
 * チャット（グループ・DM・マイルーム）の状態。
 *
 * 画面はこのストア経由でのみメッセージに触る。配列を返すセレクタは
 * useSyncExternalStore の無限ループを避けるため、必ず「生の配列をselect →
 * useMemo で絞り込む」形にすること（下のフックを参考にする）。
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayKey } from '@/lib/demoDay'
import { SEED_REVISION } from '@/mock/seed'
import { uid } from '@/lib/id'
import { safeStorage } from '@/lib/storage'
import { repository } from '@/repositories/hubRepository'
import { currentUserId } from '@/stores/sessionStore'
import type {
  Attachment,
  LinkPreview,
  Message,
  MessageType,
  Poll,
  Priority,
  Room,
  RoomKind,
  SharedNote,
} from '@/types'
import { MY_ROOM_ID } from '@/types'

const seed = repository.loadSeed()

export interface SendMessageInput {
  body: string
  type?: MessageType
  title?: string
  priority?: Priority
  attachments?: Attachment[]
  link?: LinkPreview
  poll?: Poll
  replyToId?: string
  senderId?: string
  ackRequired?: boolean
}

export interface CreateGroupInput {
  name: string
  icon: string
  accent: string
  description?: string
  memberIds: string[]
}

interface ChatState {
  seededOn: string
  seedRevision: number
  rooms: Room[]
  messages: Message[]
  notes: SharedNote[]

  sendMessage: (roomId: string, input: SendMessageInput) => string
  markRoomRead: (roomId: string) => void
  togglePin: (roomId: string) => void
  toggleMute: (roomId: string) => void
  setHidden: (roomId: string, hidden: boolean) => void
  leaveRoom: (roomId: string) => void
  createGroup: (input: CreateGroupInput) => string
  updateGroup: (roomId: string, patch: Partial<Pick<Room, 'name' | 'icon' | 'accent' | 'description' | 'memberIds' | 'adminIds'>>) => void
  createDirectRoom: (userId: string) => string
  /** 自分のマイルームを返す。無ければ作る（利用者を切り替えたとき用） */
  ensureMyRoom: () => string

  toggleReaction: (messageId: string, emoji: string) => void
  editMessage: (messageId: string, body: string) => void
  deleteMessage: (messageId: string) => void
  toggleSaved: (messageId: string) => void
  togglePinnedMessage: (messageId: string) => void
  setMessagePriority: (messageId: string, priority?: Priority, title?: string) => void
  acknowledge: (messageId: string) => void
  votePoll: (messageId: string, optionId: string) => void

  saveNote: (roomId: string, input: { title: string; body: string; summary: string }) => void

  /** 閲覧者が変わったとき（デモの利用者切り替え）に未読数を計算し直す */
  recalcForViewer: (viewerId: string) => void
  resetDemoData: () => void
}

/** メッセージの変化に合わせてルームの未読数・緊急フラグを計算し直す */
function recalcRooms(rooms: Room[], messages: Message[], viewerId: string): Room[] {
  return rooms.map((room) => {
    const unread = messages.filter(
      (m) =>
        m.roomId === room.id &&
        !m.deleted &&
        m.senderId !== viewerId &&
        !m.readUserIds.includes(viewerId),
    )
    return {
      ...room,
      unreadCount: unread.length,
      hasEmergency: unread.some((m) => m.priority === 'emergency'),
    }
  })
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      seededOn: todayKey(),
      seedRevision: SEED_REVISION,
      rooms: seed.rooms,
      messages: seed.messages,
      notes: seed.notes,

      sendMessage: (roomId, input) => {
        const viewer = currentUserId()
        const me = input.senderId ?? viewer
        const id = uid('m')
        const message: Message = {
          id,
          roomId,
          senderId: me,
          type: input.type ?? 'text',
          body: input.body,
          createdAt: new Date().toISOString(),
          // AI要約の投稿など送信者が自分以外でも、操作した本人には未読を付けない
          readUserIds: Array.from(new Set([me, viewer])),
          ...(input.title ? { title: input.title } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.attachments ? { attachments: input.attachments } : {}),
          ...(input.link ? { link: input.link } : {}),
          ...(input.poll ? { poll: input.poll } : {}),
          ...(input.replyToId ? { replyToId: input.replyToId } : {}),
          ...(input.ackRequired ? { ack: { required: true, confirmedUserIds: [] } } : {}),
        }
        set((s) => {
          const messages = [...s.messages, message]
          return { messages, rooms: recalcRooms(s.rooms, messages, currentUserId()) }
        })
        return id
      },

      markRoomRead: (roomId) => {
        const me = currentUserId()
        set((s) => {
          const messages = s.messages.map((m) =>
            m.roomId === roomId && !m.readUserIds.includes(me)
              ? { ...m, readUserIds: [...m.readUserIds, me] }
              : m,
          )
          return { messages, rooms: recalcRooms(s.rooms, messages, me) }
        })
      },

      togglePin: (roomId) =>
        set((s) => ({
          rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, pinned: !r.pinned } : r)),
        })),

      toggleMute: (roomId) =>
        set((s) => ({
          rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, muted: !r.muted } : r)),
        })),

      setHidden: (roomId, hidden) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, hidden } : r)) })),

      leaveRoom: (roomId) => {
        const me = currentUserId()
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId
              ? { ...r, hidden: true, memberIds: r.memberIds.filter((u) => u !== me) }
              : r,
          ),
        }))
      },

      createGroup: (input) => {
        const me = currentUserId()
        const id = uid('room')
        const room: Room = {
          id,
          kind: 'group',
          name: input.name,
          icon: input.icon,
          accent: input.accent,
          description: input.description ?? '',
          memberIds: Array.from(new Set([me, ...input.memberIds])),
          adminIds: [me],
          pinned: false,
          muted: false,
          hidden: false,
          unreadCount: 0,
          hasEmergency: false,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ rooms: [room, ...s.rooms] }))
        return id
      },

      updateGroup: (roomId, patch) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)) })),

      ensureMyRoom: () => {
        const me = currentUserId()
        const existing = get().rooms.find((r) => r.kind === 'myroom' && r.memberIds.includes(me))
        if (existing) return existing.id
        const id = uid('room')
        const room: Room = {
          id,
          kind: 'myroom',
          name: 'マイルーム',
          icon: '📝',
          accent: '#3157b7',
          description: '自分だけが見られるメモ・TODO・ファイル置き場',
          memberIds: [me],
          adminIds: [me],
          pinned: false,
          muted: false,
          hidden: false,
          unreadCount: 0,
          hasEmergency: false,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ rooms: [...s.rooms, room] }))
        return id
      },

      createDirectRoom: (userId) => {
        const me = currentUserId()
        const existing = get().rooms.find(
          (r) => r.kind === 'direct' && r.memberIds.includes(userId) && r.memberIds.includes(me),
        )
        if (existing) {
          if (existing.hidden) get().setHidden(existing.id, false)
          return existing.id
        }
        const id = uid('room')
        const room: Room = {
          id,
          kind: 'direct',
          name: '',
          icon: '',
          accent: '#3157b7',
          description: '',
          memberIds: [me, userId],
          adminIds: [],
          pinned: false,
          muted: false,
          hidden: false,
          unreadCount: 0,
          hasEmergency: false,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ rooms: [room, ...s.rooms] }))
        return id
      },

      toggleReaction: (messageId, emoji) => {
        const me = currentUserId()
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== messageId) return m
            const reactions = m.reactions ? [...m.reactions] : []
            const index = reactions.findIndex((r) => r.emoji === emoji)
            if (index === -1) return { ...m, reactions: [...reactions, { emoji, userIds: [me] }] }
            const target = reactions[index]
            const userIds = target.userIds.includes(me)
              ? target.userIds.filter((u) => u !== me)
              : [...target.userIds, me]
            if (userIds.length === 0) reactions.splice(index, 1)
            else reactions[index] = { ...target, userIds }
            return { ...m, reactions }
          }),
        }))
      },

      editMessage: (messageId, body) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, body, editedAt: new Date().toISOString() } : m,
          ),
        })),

      deleteMessage: (messageId) =>
        set((s) => {
          const messages = s.messages.map((m) =>
            m.id === messageId
              ? { ...m, deleted: true, body: '', attachments: undefined, link: undefined, poll: undefined }
              : m,
          )
          return { messages, rooms: recalcRooms(s.rooms, messages, currentUserId()) }
        }),

      toggleSaved: (messageId) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === messageId ? { ...m, saved: !m.saved } : m)),
        })),

      togglePinnedMessage: (messageId) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)),
        })),

      setMessagePriority: (messageId, priority, title) =>
        set((s) => {
          const messages = s.messages.map((m) => {
            if (m.id !== messageId) return m
            const next: Message = { ...m, priority, title: title ?? m.title }
            if (!priority) {
              delete next.priority
              delete next.ack
            } else if (!next.ack) {
              next.ack = { required: true, confirmedUserIds: [] }
            }
            return next
          })
          return { messages, rooms: recalcRooms(s.rooms, messages, currentUserId()) }
        }),

      acknowledge: (messageId) => {
        const me = currentUserId()
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId && m.ack && !m.ack.confirmedUserIds.includes(me)
              ? { ...m, ack: { ...m.ack, confirmedUserIds: [...m.ack.confirmedUserIds, me] } }
              : m,
          ),
        }))
      },

      votePoll: (messageId, optionId) => {
        const me = currentUserId()
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== messageId || !m.poll) return m
            const options = m.poll.options.map((o) => {
              const voted = o.voterIds.includes(me)
              if (o.id === optionId) {
                return {
                  ...o,
                  voterIds: voted ? o.voterIds.filter((u) => u !== me) : [...o.voterIds, me],
                }
              }
              if (!m.poll?.multiple) return { ...o, voterIds: o.voterIds.filter((u) => u !== me) }
              return o
            })
            return { ...m, poll: { ...m.poll, options } }
          }),
        }))
      },

      saveNote: (roomId, input) => {
        const me = currentUserId()
        const now = new Date().toISOString()
        set((s) => {
          const existing = s.notes.find((n) => n.roomId === roomId)
          const version = (existing?.version ?? 0) + 1
          const revision = {
            id: uid('rev'),
            version,
            updatedBy: me,
            updatedAt: now,
            summary: input.summary || '内容を更新',
            body: input.body,
          }
          const next: SharedNote = {
            roomId,
            title: input.title,
            body: input.body,
            version,
            updatedBy: me,
            updatedAt: now,
            revisions: [revision, ...(existing?.revisions ?? [])],
          }
          return {
            notes: existing
              ? s.notes.map((n) => (n.roomId === roomId ? next : n))
              : [...s.notes, next],
          }
        })
      },

      recalcForViewer: (viewerId) =>
        set((s) => ({ rooms: recalcRooms(s.rooms, s.messages, viewerId) })),

      resetDemoData: () => {
        const fresh = repository.loadSeed(currentUserId())
        set({
          seededOn: todayKey(),
          seedRevision: SEED_REVISION,
          rooms: fresh.rooms,
          messages: fresh.messages,
          notes: fresh.notes,
        })
      },
    }),
    {
      name: 'hch.chat.v1',
      storage: createJSONStorage(() => safeStorage),
      // 保存データの形を変えたらここを上げる。migrate を置かないので古い保存分は捨てられる
      version: 1,
      // 版が変わったら保存分は捨てる（そのための merge があるので復元はしない）
      migrate: () => undefined as never,
      partialize: (s) => ({
        seededOn: s.seededOn,
        seedRevision: s.seedRevision,
        rooms: s.rooms,
        messages: s.messages,
        notes: s.notes,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ChatState> | undefined
        // 日付が変わった／モックの版が上がったときは保存分を捨てて作り直す
        if (!p || p.seededOn !== todayKey() || p.seedRevision !== SEED_REVISION) return current
        return { ...current, ...p }
      },
    },
  ),
)

/* --------------------------------------------------------------- セレクタ */

export function useRoom(roomId: string | undefined): Room | undefined {
  return useChatStore((s) => (roomId ? s.rooms.find((r) => r.id === roomId) : undefined))
}

/** 指定した種別の、非表示でないルームを「ピン留め → 最終発言が新しい順」で返す */
export function useRoomList(kind: RoomKind): Room[] {
  const rooms = useChatStore((s) => s.rooms)
  const messages = useChatStore((s) => s.messages)
  const meId = currentUserId()
  return useMemo(() => {
    const lastAt = new Map<string, string>()
    for (const m of messages) {
      const prev = lastAt.get(m.roomId)
      if (!prev || m.createdAt > prev) lastAt.set(m.roomId, m.createdAt)
    }
    return rooms
      .filter((r) => r.kind === kind && !r.hidden && r.memberIds.includes(meId))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return (lastAt.get(b.id) ?? b.createdAt).localeCompare(lastAt.get(a.id) ?? a.createdAt)
      })
  }, [rooms, messages, kind, meId])
}

/** 非表示にしたルーム（復帰用） */
export function useHiddenRooms(kind: RoomKind): Room[] {
  const rooms = useChatStore((s) => s.rooms)
  const meId = currentUserId()
  return useMemo(
    () => rooms.filter((r) => r.kind === kind && r.hidden && r.memberIds.includes(meId)),
    [rooms, kind, meId],
  )
}

export function useRoomMessages(roomId: string | undefined): Message[] {
  const messages = useChatStore((s) => s.messages)
  return useMemo(
    () => (roomId ? messages.filter((m) => m.roomId === roomId) : []),
    [messages, roomId],
  )
}

export function useLastMessage(roomId: string): Message | undefined {
  const messages = useChatStore((s) => s.messages)
  return useMemo(() => {
    let last: Message | undefined
    for (const m of messages) {
      if (m.roomId !== roomId) continue
      if (!last || m.createdAt > last.createdAt) last = m
    }
    return last
  }, [messages, roomId])
}

export function useNote(roomId: string | undefined): SharedNote | undefined {
  return useChatStore((s) => (roomId ? s.notes.find((n) => n.roomId === roomId) : undefined))
}

/** 保存したメッセージ・ピン留めメッセージ */
export function usePinnedMessages(roomId: string): Message[] {
  const messages = useRoomMessages(roomId)
  return useMemo(() => messages.filter((m) => m.pinned && !m.deleted), [messages])
}

/** 全ルーム合計の未読数（ボトムナビのバッジ用） */
export function useTotalUnread(kind: RoomKind): number {
  const rooms = useChatStore((s) => s.rooms)
  return useMemo(
    () =>
      rooms
        .filter(
          (r) =>
            r.kind === kind && !r.hidden && !r.muted && r.memberIds.includes(currentUserId()),
        )
        .reduce((sum, r) => sum + r.unreadCount, 0),
    [rooms, kind],
  )
}

export { MY_ROOM_ID }
