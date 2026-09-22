/**
 * 管理画面のセクション定義（設計指示 §19 §20）。
 *
 * ここだけで「どの権限にどのセクションを見せるか」を決める。
 * サブナビと本文の出し分けは同じ定義を使うので、導線と中身がずれない。
 */
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  ScrollText,
  Settings,
  Siren,
  Users,
} from 'lucide-react'
import type { Role } from '@/types'
import { ROLE_RANK } from '@/types'

export type AdminSectionId =
  | 'dashboard'
  | 'groups'
  | 'users'
  | 'departments'
  | 'announcements'
  | 'surveys'
  | 'safety'
  | 'audit'
  | 'settings'

export interface AdminSectionDef {
  id: AdminSectionId
  label: string
  /** 画面上部に出す1行説明 */
  description: string
  icon: LucideIcon
  /** このセクションを開ける最低権限 */
  minRole: Role
}

/** `section` が未指定のときに開くセクション */
export const DEFAULT_ADMIN_SECTION: AdminSectionId = 'dashboard'

export const ADMIN_SECTIONS: AdminSectionDef[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    description: '院内ハブの利用状況と直近の動きをまとめて確認します。',
    icon: LayoutDashboard,
    minRole: 'GROUP_ADMIN',
  },
  {
    id: 'groups',
    label: 'グループ',
    description: 'チャットグループの一覧と新規作成を行います。',
    icon: MessagesSquare,
    minRole: 'GROUP_ADMIN',
  },
  {
    id: 'users',
    label: 'ユーザー',
    description: '職員名簿の確認と、権限・在籍の管理を行います。',
    icon: Users,
    minRole: 'DEPARTMENT_ADMIN',
  },
  {
    id: 'departments',
    label: '部署',
    description: '部署と責任者の一覧です。',
    icon: Building2,
    minRole: 'DEPARTMENT_ADMIN',
  },
  {
    id: 'announcements',
    label: 'お知らせ',
    description: '配信済みのお知らせと既読状況を確認します。',
    icon: Megaphone,
    minRole: 'DEPARTMENT_ADMIN',
  },
  {
    id: 'surveys',
    label: 'アンケート',
    description: 'アンケートの回答状況の確認と、受付の開始・締め切りを行います。',
    icon: ClipboardList,
    minRole: 'DEPARTMENT_ADMIN',
  },
  {
    id: 'safety',
    label: '安否確認',
    description: '安否確認の回答状況を集計し、訓練の開始・終了を切り替えます。',
    icon: Siren,
    minRole: 'DEPARTMENT_ADMIN',
  },
  {
    id: 'audit',
    label: '監査ログ',
    description: '院内ハブ上で行われた操作の記録です。',
    icon: ScrollText,
    minRole: 'SYSTEM_ADMIN',
  },
  {
    id: 'settings',
    label: 'システム設定',
    description: '通知・パスワード・保存期間の既定値です。',
    icon: Settings,
    minRole: 'SYSTEM_ADMIN',
  },
]

/** URL の `:section` に対応する定義。権限は見ない（呼び出し側で判定する）。 */
export function findAdminSection(id: string | undefined): AdminSectionDef | undefined {
  return ADMIN_SECTIONS.find((s) => s.id === (id ?? DEFAULT_ADMIN_SECTION))
}

/**
 * 管理画面に入れる最低権限。ADMIN_SECTIONS の最小値から導くので、
 * セクションの権限を変えても入口と中身がずれない。
 */
export const ADMIN_ENTRY_ROLE: Role = ADMIN_SECTIONS.reduce<Role>(
  (min, section) => (ROLE_RANK[section.minRole] < ROLE_RANK[min] ? section.minRole : min),
  'SYSTEM_ADMIN',
)
