/**
 * モックデータの読み込み。
 *
 * JSON は基準日 2026-09-22 の日時で書かれている。いつデモしても「今日の会話」に
 * 見えるよう、読み込み時にすべての ISO 日時を（今日 − 基準日）日ぶんずらす。
 * 時刻はそのまま残るので、朝の連絡は朝に、昼の連絡は昼に表示される。
 */
import announcementsJson from '@/data/announcements.json'
import auditLogsJson from '@/data/auditLogs.json'
import departmentsJson from '@/data/departments.json'
import knowledgeJson from '@/data/knowledge.json'
import messagesJson from '@/data/messages.json'
import notesJson from '@/data/notes.json'
import roomsJson from '@/data/rooms.json'
import safetyJson from '@/data/safety.json'
import surveysJson from '@/data/surveys.json'
import troubleOptionsJson from '@/data/troubleOptions.json'
import troublesJson from '@/data/troubles.json'
import usersJson from '@/data/users.json'
import type {
  Announcement,
  AuditLog,
  Department,
  KnowledgeDoc,
  Message,
  Room,
  SafetyDrill,
  SharedNote,
  Survey,
  TroubleReport,
  User,
} from '@/types'

/** JSON に書かれている基準日 */
const ANCHOR_DATE = '2026-09-22'

/**
 * モックデータやストアの形を変えたら上げる。
 * 保存済みのデータがこれと違えば捨てて作り直すので、
 * 「同じ日に配り直した修正版で、古い保存データが勝つ」事故を防げる。
 */
export const SEED_REVISION = 2

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** 基準日から今日までのずらし幅（ミリ秒）。過去日になることはない想定だが負値でも動く。 */
function shiftMs(): number {
  const [y, m, d] = ANCHOR_DATE.split('-').map(Number)
  const anchor = new Date(y, m - 1, d)
  return startOfLocalDay(new Date()).getTime() - anchor.getTime()
}

function shiftIso(value: string, delta: number): string {
  return new Date(new Date(value).getTime() + delta).toISOString()
}

/** ISO 日時らしき文字列をすべてずらしながらディープコピーする */
function rebase<T>(value: T, delta: number): T {
  if (typeof value === 'string') {
    return (ISO_PATTERN.test(value) ? shiftIso(value, delta) : value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => rebase(item, delta)) as T
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = rebase(item, delta)
    }
    return out as T
  }
  return value
}

export interface SeedData {
  users: User[]
  departments: Department[]
  rooms: Room[]
  messages: Message[]
  notes: SharedNote[]
  announcements: Announcement[]
  knowledge: KnowledgeDoc[]
  troubles: TroubleReport[]
  troubleOptions: { categories: string[]; locations: string[] }
  safetyDrills: SafetyDrill[]
  surveys: Survey[]
  auditLogs: AuditLog[]
}

/**
 * ルームの未読数・緊急フラグは messages から必ず計算し直す。
 * JSON 側の値とずれても、画面には計算結果だけが出る。
 */
function withDerivedRoomState(rooms: Room[], messages: Message[], viewerId: string): Room[] {
  return rooms.map((room) => {
    const roomMessages = messages.filter((m) => m.roomId === room.id && !m.deleted)
    const unread = roomMessages.filter(
      (m) => m.senderId !== viewerId && !m.readUserIds.includes(viewerId),
    )
    return {
      ...room,
      unreadCount: unread.length,
      hasEmergency: unread.some((m) => m.priority === 'emergency'),
    }
  })
}

/** 既定の閲覧者（デモの主人公）。臨床工学技士の内藤。 */
export const DEFAULT_USER_ID = 'u-naito'

export function createSeed(viewerId: string = DEFAULT_USER_ID): SeedData {
  const delta = shiftMs()
  const messages = rebase(messagesJson as unknown as Message[], delta)
  const rooms = rebase(roomsJson as unknown as Room[], delta)
  return {
    users: rebase(usersJson as unknown as User[], delta),
    // 3つのストアから呼ばれるので、JSON の参照をそのまま渡さない（共有されてしまう）
    departments: rebase(departmentsJson as unknown as Department[], delta),
    rooms: withDerivedRoomState(rooms, messages, viewerId),
    messages,
    notes: rebase(notesJson as unknown as SharedNote[], delta),
    announcements: rebase(announcementsJson as unknown as Announcement[], delta),
    knowledge: rebase(knowledgeJson as unknown as KnowledgeDoc[], delta),
    troubles: rebase(troublesJson as unknown as TroubleReport[], delta),
    troubleOptions: rebase(troubleOptionsJson, delta),
    safetyDrills: rebase(safetyJson as unknown as SafetyDrill[], delta),
    surveys: rebase(surveysJson as unknown as Survey[], delta),
    auditLogs: rebase(auditLogsJson as unknown as AuditLog[], delta),
  }
}
