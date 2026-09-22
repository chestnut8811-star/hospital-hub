import { getUser } from '@/stores/directoryStore'
import type { Room, User } from '@/types'

/** DM の相手。グループ・マイルームでは undefined */
export function getRoomPeer(room: Room, meId: string): User | undefined {
  if (room.kind !== 'direct') return undefined
  const peerId = room.memberIds.find((id) => id !== meId)
  return peerId ? getUser(peerId) : undefined
}

/** 一覧やヘッダーに出す名前。DM は相手の氏名にする */
export function getRoomTitle(room: Room, meId: string): string {
  if (room.kind !== 'direct') return room.name
  const peer = getRoomPeer(room, meId)
  return peer ? peer.name : room.name || '個人チャット'
}

/** ヘッダーの2行目 */
export function getRoomSubtitle(room: Room, meId: string): string {
  if (room.kind === 'myroom') return '自分だけが見られます'
  if (room.kind === 'direct') {
    const peer = getRoomPeer(room, meId)
    return peer ? `${peer.department}・${peer.jobTitle}` : ''
  }
  return `メンバー ${room.memberIds.length} 人`
}
