/**
 * Hospital Communication Hub — ドメイン型
 *
 * ここが唯一の型定義。画面・ストア・モックデータはすべてこの型に従う。
 * Phase 3 でバックエンドに繋ぐときも、この形をAPIの契約として使う。
 */

/* ------------------------------------------------------------------ 権限 */

export type Role = 'USER' | 'GROUP_ADMIN' | 'DEPARTMENT_ADMIN' | 'SYSTEM_ADMIN'

/** 権限の強さ。数値が大きいほど強い。 */
export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  GROUP_ADMIN: 1,
  DEPARTMENT_ADMIN: 2,
  SYSTEM_ADMIN: 3,
}

export const ROLE_LABEL: Record<Role, string> = {
  USER: '一般職員',
  GROUP_ADMIN: 'グループ管理者',
  DEPARTMENT_ADMIN: '部門管理者',
  SYSTEM_ADMIN: 'システム管理者',
}

/* ------------------------------------------------------------------ 利用者 */

/** human=職員、ai=AIアシスタント、system=システム通知 */
export type UserKind = 'human' | 'ai' | 'system'

export interface User {
  id: string
  /** 表示名（姓のみ、または姓名） */
  name: string
  kana: string
  kind: UserKind
  role: Role
  /** 職種（臨床工学技士・看護師・医師 など） */
  jobTitle: string
  /** 所属（臨床工学室・手術室 など） */
  department: string
  /** アバターに使う色（CSSカラー） */
  avatarColor: string
  /** アバターに表示する1〜2文字 */
  initials: string
  active: boolean
  /** 内線・PHS番号（架空） */
  extension?: string
  lastSeenAt?: string
}

/* ------------------------------------------------------------------ ルーム */

export type RoomKind = 'group' | 'direct' | 'myroom'

export interface Room {
  id: string
  kind: RoomKind
  name: string
  /** グループアイコン（絵文字） */
  icon: string
  /** アイコン背景色（CSSカラー） */
  accent: string
  description?: string
  memberIds: string[]
  /** このルームの管理者 */
  adminIds: string[]
  pinned: boolean
  muted: boolean
  hidden: boolean
  unreadCount: number
  /** 未確認の緊急メッセージを含むか */
  hasEmergency: boolean
  createdAt: string
}

/* -------------------------------------------------------------- メッセージ */

export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'url'
  | 'system'
  | 'ai'
  | 'announcement'
  | 'form'

export type Priority = 'emergency' | 'important' | 'normal'

export const PRIORITY_LABEL: Record<Priority, string> = {
  emergency: '緊急',
  important: '重要',
  normal: '通常',
}

export interface Attachment {
  id: string
  kind: 'image' | 'file'
  name: string
  /** '2.4 MB' のような表示用文字列 */
  size?: string
  mime?: string
  /** 画像はダミーのため、内容を説明する文で代替する */
  caption?: string
  /** プレースホルダの色 */
  accent?: string
}

export interface LinkPreview {
  url: string
  title: string
  description?: string
  site?: string
}

export interface Reaction {
  emoji: string
  userIds: string[]
}

/** 「確認しました」ボタンつきメッセージ */
export interface Acknowledgement {
  required: boolean
  confirmedUserIds: string[]
}

export interface PollOption {
  id: string
  label: string
  voterIds: string[]
}

export interface Poll {
  question: string
  options: PollOption[]
  multiple: boolean
  closesAt?: string
}

export interface Message {
  id: string
  roomId: string
  /** 'ai' / 'system' は擬似ユーザー */
  senderId: string
  type: MessageType
  body: string
  createdAt: string
  editedAt?: string
  /** 重要メッセージのときだけ設定する */
  priority?: Priority
  /** 重要メッセージ・お知らせの見出し */
  title?: string
  attachments?: Attachment[]
  link?: LinkPreview
  poll?: Poll
  replyToId?: string
  reactions?: Reaction[]
  readUserIds: string[]
  ack?: Acknowledgement
  pinned?: boolean
  /** 自分が保存したか（プロトタイプでは全員共通） */
  saved?: boolean
  deleted?: boolean
}

/* ------------------------------------------------------------ 共有ノート */

export interface NoteRevision {
  id: string
  version: number
  updatedBy: string
  updatedAt: string
  summary: string
  body: string
}

export interface SharedNote {
  roomId: string
  title: string
  /** Markdown */
  body: string
  version: number
  updatedBy: string
  updatedAt: string
  revisions: NoteRevision[]
}

/* ---------------------------------------------------------------- お知らせ */

export interface Announcement {
  id: string
  title: string
  body: string
  priority: Priority
  category: string
  publishedAt: string
  authorId: string
  /** 配信対象の部署名。['全職員'] で全体 */
  targets: string[]
  readUserIds: string[]
  attachments?: Attachment[]
}

/* ------------------------------------------------------- 機器トラブル報告 */

export type TroubleSeverity = 'low' | 'medium' | 'high'
export type TroubleStatus = 'open' | 'in_progress' | 'resolved'

export const TROUBLE_SEVERITY_LABEL: Record<TroubleSeverity, string> = {
  low: '低（代替あり・業務継続可）',
  medium: '中（早めの対応が必要）',
  high: '高（使用中止・即時対応）',
}

export const TROUBLE_STATUS_LABEL: Record<TroubleStatus, string> = {
  open: '受付',
  in_progress: '対応中',
  resolved: '対応済',
}

export interface TroubleUpdate {
  at: string
  byUserId: string
  text: string
}

export interface TroubleReport {
  id: string
  /** 機器カテゴリー（輸液ポンプ・人工呼吸器 など） */
  category: string
  deviceName: string
  /** 管理番号 */
  assetNo: string
  location: string
  symptom: string
  severity: TroubleSeverity
  status: TroubleStatus
  /** 写真はダミーのため説明文で代替 */
  photoNote?: string
  reporterId: string
  reportedAt: string
  assigneeId?: string
  /** 自動投稿先のルーム */
  roomId: string
  updates: TroubleUpdate[]
}

/* ------------------------------------------------------------ 院内ナレッジ */

export type KnowledgeDocType = 'manual' | 'faq' | 'material' | 'education'

export const KNOWLEDGE_TYPE_LABEL: Record<KnowledgeDocType, string> = {
  manual: '院内マニュアル',
  faq: 'FAQ',
  material: '関連資料',
  education: '教育コンテンツ',
}

export interface KnowledgeDoc {
  id: string
  title: string
  docType: KnowledgeDocType
  category: string
  summary: string
  /** Markdown */
  body: string
  tags: string[]
  updatedAt: string
  /** 出典（部署名・資料名）。臨床内容の裏取り元を明示するため必須 */
  source: string
  attachmentName?: string
}

/* -------------------------------------------------------------- 安否確認 */

export type SafetyLocation = 'hospital' | 'home' | 'other'
export type SafetyCondition = 'ok' | 'minor_injury' | 'need_support'

export const SAFETY_LOCATION_LABEL: Record<SafetyLocation, string> = {
  hospital: '院内',
  home: '自宅',
  other: 'その他',
}

export const SAFETY_CONDITION_LABEL: Record<SafetyCondition, string> = {
  ok: '問題なし',
  minor_injury: '軽傷',
  need_support: '支援が必要',
}

export interface SafetyResponse {
  userId: string
  location: SafetyLocation
  condition: SafetyCondition
  comment?: string
  canCome?: boolean
  respondedAt: string
}

export interface SafetyDrill {
  id: string
  title: string
  body: string
  startedAt: string
  active: boolean
  /** 訓練かどうか。プロトタイプは常に訓練 */
  isDrill: boolean
  targetUserIds: string[]
  responses: SafetyResponse[]
}

/* -------------------------------------------------------------- アンケート */

export type SurveyQuestionType = 'single' | 'multiple' | 'text' | 'scale'

export interface SurveyQuestion {
  id: string
  type: SurveyQuestionType
  text: string
  required: boolean
  options?: string[]
}

export interface SurveyAnswer {
  questionId: string
  /** single/text は string、multiple は string[]、scale は number */
  value: string | string[] | number
}

export interface SurveyResponse {
  userId: string
  answeredAt: string
  answers: SurveyAnswer[]
}

export interface Survey {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: string
  closesAt?: string
  status: 'open' | 'closed'
  anonymous: boolean
  targets: string[]
  questions: SurveyQuestion[]
  responses: SurveyResponse[]
}

/* -------------------------------------------------------------- 部署・監査 */

export interface Department {
  id: string
  name: string
  managerId: string
  memberCount: number
}

export interface AuditLog {
  id: string
  at: string
  actorId: string
  action: string
  target: string
  detail: string
}

/* ------------------------------------------------------------ メニュータイル */

export interface AppTile {
  id: string
  label: string
  description: string
  /** lucide-react のアイコン名 */
  icon: string
  to: string
  /** このタイルを見せる最低権限 */
  minRole: Role
  /** バッジに出す件数の種別 */
  badge?: 'announcements' | 'troubles' | 'safety' | 'surveys'
  accent: string
}

/* -------------------------------------------------------------------- 定数 */

export const AI_USER_ID = 'ai'
export const SYSTEM_USER_ID = 'system'
export const MY_ROOM_ID = 'room-myroom'

export function hasRole(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required]
}
