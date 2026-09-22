/**
 * アプリ全体のナビゲーション定義。
 * メニュー画面のタイルと PC のサイドバーで同じ定義を使い、導線のずれを防ぐ。
 */
import {
  Bot,
  BookOpen,
  LayoutGrid,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  NotebookPen,
  ClipboardList,
  ShieldCheck,
  Siren,
  User,
  Wrench,
} from 'lucide-react'
import type { Role } from '@/types'

export type BadgeKind = 'announcements' | 'troubles' | 'safety' | 'surveys'

export interface NavItem {
  id: string
  label: string
  description: string
  to: string
  icon: LucideIcon
  /** この項目を表示する最低権限 */
  minRole: Role
  badge?: BadgeKind
  /** タイルのアイコン色 */
  accent: string
}

/** メニュー画面のタイル（設計書 §10） */
export const APP_TILES: NavItem[] = [
  {
    id: 'myroom',
    label: 'マイルーム',
    description: '自分だけのメモ・TODO・ファイル',
    to: '/myroom',
    icon: NotebookPen,
    minRole: 'USER',
    accent: '#3157b7',
  },
  {
    id: 'knowledge',
    label: '院内ナレッジ',
    description: 'マニュアル・FAQ・資料を検索',
    to: '/knowledge',
    icon: BookOpen,
    minRole: 'USER',
    accent: '#2f9e6f',
  },
  {
    id: 'ai',
    label: 'AI アシスタント',
    description: '院内の資料をもとに質問に答える',
    to: '/ai',
    icon: Bot,
    minRole: 'USER',
    accent: '#6b4bc4',
  },
  {
    id: 'announcements',
    label: 'お知らせ',
    description: '院内からの連絡事項',
    to: '/announcements',
    icon: Megaphone,
    minRole: 'USER',
    badge: 'announcements',
    accent: '#b9701a',
  },
  {
    id: 'trouble',
    label: '機器トラブル',
    description: '医療機器の不具合を報告する',
    to: '/trouble',
    icon: Wrench,
    minRole: 'USER',
    badge: 'troubles',
    accent: '#d64545',
  },
  {
    id: 'surveys',
    label: 'アンケート',
    description: '院内アンケートへの回答',
    to: '/surveys',
    icon: ClipboardList,
    minRole: 'USER',
    badge: 'surveys',
    accent: '#2b7fa8',
  },
  {
    id: 'safety',
    label: '安否確認',
    description: '災害時の安否報告',
    to: '/safety',
    icon: Siren,
    minRole: 'USER',
    badge: 'safety',
    accent: '#c2557e',
  },
  {
    id: 'admin',
    label: '管理',
    description: 'ユーザー・部署・配信の管理',
    to: '/admin',
    icon: ShieldCheck,
    minRole: 'GROUP_ADMIN',
    accent: '#20242c',
  },
]

/** 下部ナビゲーションの3タブ（設計書 §3） */
export const BOTTOM_TABS = [
  { id: 'groups', label: 'グループ', to: '/groups', icon: MessageSquare },
  { id: 'direct', label: '個人', to: '/direct', icon: User },
  { id: 'menu', label: 'メニュー', to: '/menu', icon: LayoutGrid },
] as const

/** id でタイルを引く。APP_TILES を並び替えてもサイドバーがずれないようにするため。 */
function tile(id: string): NavItem {
  const found = APP_TILES.find((item) => item.id === id)
  if (!found) throw new Error(`APP_TILES に "${id}" がありません`)
  return found
}

/** PC のサイドバー */
export const SIDEBAR_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'チャット',
    items: [
      {
        id: 'groups',
        label: 'グループ',
        description: '',
        to: '/groups',
        icon: MessageSquare,
        minRole: 'USER',
        accent: '#3157b7',
      },
      {
        id: 'direct',
        label: '個人',
        description: '',
        to: '/direct',
        icon: User,
        minRole: 'USER',
        accent: '#3157b7',
      },
      tile('myroom'),
    ],
  },
  {
    title: '院内',
    items: [
      tile('knowledge'),
      tile('ai'),
      tile('announcements'),
      tile('trouble'),
      tile('surveys'),
      tile('safety'),
    ],
  },
  { title: '管理', items: [tile('admin')] },
]
