/**
 * チャット以外の院内機能（お知らせ・機器トラブル・ナレッジ・安否確認・アンケート・監査ログ）。
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayKey } from '@/lib/demoDay'
import { SEED_REVISION } from '@/mock/seed'
import { uid } from '@/lib/id'
import { safeStorage } from '@/lib/storage'
import { isVisibleToUser } from '@/lib/targeting'
import { repository } from '@/repositories/hubRepository'
import { useChatStore } from '@/stores/chatStore'
import { currentUserId } from '@/stores/sessionStore'
import type {
  Announcement,
  AuditLog,
  KnowledgeDoc,
  Priority,
  SafetyCondition,
  SafetyDrill,
  SafetyLocation,
  Survey,
  SurveyAnswer,
  SurveyQuestion,
  TroubleReport,
  TroubleSeverity,
  TroubleStatus,
} from '@/types'
import { TROUBLE_SEVERITY_LABEL } from '@/types'

const seed = repository.loadSeed()

export interface CreateAnnouncementInput {
  title: string
  body: string
  priority: Priority
  category: string
  targets: string[]
}

export interface CreateTroubleInput {
  category: string
  deviceName: string
  assetNo: string
  location: string
  symptom: string
  severity: TroubleSeverity
  photoNote?: string
}

export interface CreateSurveyInput {
  title: string
  description: string
  targets: string[]
  anonymous: boolean
  questions: SurveyQuestion[]
  closesAt?: string
}

const TROUBLE_ROOM_ID = 'room-trouble'

interface HubState {
  seededOn: string
  seedRevision: number
  announcements: Announcement[]
  knowledge: KnowledgeDoc[]
  troubles: TroubleReport[]
  troubleOptions: { categories: string[]; locations: string[] }
  safetyDrills: SafetyDrill[]
  surveys: Survey[]
  auditLogs: AuditLog[]

  markAnnouncementRead: (id: string) => void
  createAnnouncement: (input: CreateAnnouncementInput) => string

  createTrouble: (input: CreateTroubleInput) => string
  updateTroubleStatus: (id: string, status: TroubleStatus) => void
  addTroubleUpdate: (id: string, text: string) => void
  assignTrouble: (id: string, userId: string) => void

  submitSafetyResponse: (
    drillId: string,
    input: {
      location: SafetyLocation
      condition: SafetyCondition
      comment?: string
      canCome?: boolean
    },
  ) => void
  setDrillActive: (drillId: string, active: boolean) => void

  submitSurveyResponse: (surveyId: string, answers: SurveyAnswer[]) => void
  createSurvey: (input: CreateSurveyInput) => string
  setSurveyStatus: (surveyId: string, status: 'open' | 'closed') => void

  addAuditLog: (action: string, target: string, detail: string) => void
  resetDemoData: () => void
}

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => ({
      seededOn: todayKey(),
      seedRevision: SEED_REVISION,
      announcements: seed.announcements,
      knowledge: seed.knowledge,
      troubles: seed.troubles,
      troubleOptions: seed.troubleOptions,
      safetyDrills: seed.safetyDrills,
      surveys: seed.surveys,
      auditLogs: seed.auditLogs,

      markAnnouncementRead: (id) => {
        const me = currentUserId()
        set((s) => {
          const target = s.announcements.find((a) => a.id === id)
          // 既読済みなら何もしない（毎回新しい配列を返すと localStorage への書き込みが走るため）
          if (!target || target.readUserIds.includes(me)) return {}
          return {
            announcements: s.announcements.map((a) =>
              a.id === id ? { ...a, readUserIds: [...a.readUserIds, me] } : a,
            ),
          }
        })
      },

      createAnnouncement: (input) => {
        const me = currentUserId()
        const id = uid('an')
        const announcement: Announcement = {
          id,
          title: input.title,
          body: input.body,
          priority: input.priority,
          category: input.category,
          publishedAt: new Date().toISOString(),
          authorId: me,
          targets: input.targets,
          readUserIds: [me],
        }
        set((s) => ({ announcements: [announcement, ...s.announcements] }))
        get().addAuditLog('お知らせ配信', input.title, `対象：${input.targets.join('・')}`)
        return id
      },

      createTrouble: (input) => {
        const me = currentUserId()
        const now = new Date()
        // 採番は T-<年>-<月日>-<連番>。既存の同日分を接頭辞で数えて連番を続ける
        // （接頭辞以外で数えると seed の報告と ID が衝突して詳細画面が開けなくなる）
        const prefix = `T-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        // 件数ではなく「同日の末尾番号の最大値 + 1」。
        // 既存の番号が飛んでいても（seed の 0918 は -03 だけ）衝突しない。
        const maxSuffix = get().troubles.reduce((max, t) => {
          if (!t.id.startsWith(`${prefix}-`)) return max
          const n = Number.parseInt(t.id.slice(prefix.length + 1), 10)
          return Number.isNaN(n) ? max : Math.max(max, n)
        }, 0)
        const id = `${prefix}-${String(maxSuffix + 1).padStart(2, '0')}`
        const report: TroubleReport = {
          id,
          category: input.category,
          deviceName: input.deviceName,
          assetNo: input.assetNo,
          location: input.location,
          symptom: input.symptom,
          severity: input.severity,
          status: 'open',
          reporterId: me,
          reportedAt: now.toISOString(),
          roomId: TROUBLE_ROOM_ID,
          updates: [],
          ...(input.photoNote ? { photoNote: input.photoNote } : {}),
        }
        set((s) => ({ troubles: [report, ...s.troubles] }))

        // 指定グループへ自動投稿する（設計指示 §18）
        useChatStore.getState().sendMessage(TROUBLE_ROOM_ID, {
          body: [
            '🔧 機器トラブル報告',
            '',
            `機器：${input.deviceName}`,
            `管理番号：${input.assetNo}`,
            `場所：${input.location}`,
            `緊急度：${TROUBLE_SEVERITY_LABEL[input.severity]}`,
            '',
            '症状：',
            input.symptom,
            ...(input.photoNote ? ['', `写真：${input.photoNote}`] : []),
          ].join('\n'),
          title: `機器トラブル報告 ${id}`,
          priority: input.severity === 'high' ? 'emergency' : 'important',
          ackRequired: input.severity === 'high',
        })
        get().addAuditLog(
          '機器トラブル報告',
          id,
          `${input.category} / ${input.assetNo} / ${input.location}`,
        )
        return id
      },

      updateTroubleStatus: (id, status) => {
        set((s) => ({ troubles: s.troubles.map((t) => (t.id === id ? { ...t, status } : t)) }))
        get().addAuditLog('トラブル対応更新', id, `状態を「${status}」に変更`)
      },

      addTroubleUpdate: (id, text) => {
        const me = currentUserId()
        set((s) => ({
          troubles: s.troubles.map((t) =>
            t.id === id
              ? { ...t, updates: [...t.updates, { at: new Date().toISOString(), byUserId: me, text }] }
              : t,
          ),
        }))
      },

      assignTrouble: (id, userId) =>
        set((s) => ({
          troubles: s.troubles.map((t) => (t.id === id ? { ...t, assigneeId: userId } : t)),
        })),

      submitSafetyResponse: (drillId, input) => {
        const me = currentUserId()
        set((s) => ({
          safetyDrills: s.safetyDrills.map((d) => {
            if (d.id !== drillId) return d
            const response = {
              userId: me,
              location: input.location,
              condition: input.condition,
              respondedAt: new Date().toISOString(),
              ...(input.comment ? { comment: input.comment } : {}),
              ...(input.canCome === undefined ? {} : { canCome: input.canCome }),
            }
            return {
              ...d,
              responses: [...d.responses.filter((r) => r.userId !== me), response],
            }
          }),
        }))
      },

      setDrillActive: (drillId, active) => {
        set((s) => ({
          safetyDrills: s.safetyDrills.map((d) => (d.id === drillId ? { ...d, active } : d)),
        }))
        const drill = get().safetyDrills.find((d) => d.id === drillId)
        get().addAuditLog(
          active ? '安否確認の開始' : '安否確認の終了',
          drill?.title ?? drillId,
          active ? `対象 ${drill?.targetUserIds.length ?? 0} 名へ配信` : '受付を終了',
        )
      },

      submitSurveyResponse: (surveyId, answers) => {
        const me = currentUserId()
        set((s) => ({
          surveys: s.surveys.map((sv) =>
            sv.id === surveyId
              ? {
                  ...sv,
                  responses: [
                    ...sv.responses.filter((r) => r.userId !== me),
                    { userId: me, answeredAt: new Date().toISOString(), answers },
                  ],
                }
              : sv,
          ),
        }))
      },

      createSurvey: (input) => {
        const me = currentUserId()
        const id = uid('sv')
        const survey: Survey = {
          id,
          title: input.title,
          description: input.description,
          createdBy: me,
          createdAt: new Date().toISOString(),
          status: 'open',
          anonymous: input.anonymous,
          targets: input.targets,
          questions: input.questions,
          responses: [],
          ...(input.closesAt ? { closesAt: input.closesAt } : {}),
        }
        set((s) => ({ surveys: [survey, ...s.surveys] }))
        get().addAuditLog('アンケート作成', input.title, `対象：${input.targets.join('・')}`)
        return id
      },

      setSurveyStatus: (surveyId, status) => {
        set((s) => ({
          surveys: s.surveys.map((sv) => (sv.id === surveyId ? { ...sv, status } : sv)),
        }))
        const survey = get().surveys.find((sv) => sv.id === surveyId)
        get().addAuditLog(
          status === 'closed' ? 'アンケートの締め切り' : 'アンケートの再開',
          survey?.title ?? surveyId,
          `回答 ${survey?.responses.length ?? 0} 件`,
        )
      },

      addAuditLog: (action, target, detail) =>
        set((s) => ({
          auditLogs: [
            {
              id: uid('al'),
              at: new Date().toISOString(),
              actorId: currentUserId(),
              action,
              target,
              detail,
            },
            ...s.auditLogs,
          ],
        })),

      resetDemoData: () => {
        const fresh = repository.loadSeed(currentUserId())
        set({
          seededOn: todayKey(),
          seedRevision: SEED_REVISION,
          announcements: fresh.announcements,
          knowledge: fresh.knowledge,
          troubles: fresh.troubles,
          troubleOptions: fresh.troubleOptions,
          safetyDrills: fresh.safetyDrills,
          surveys: fresh.surveys,
          auditLogs: fresh.auditLogs,
        })
      },
    }),
    {
      name: 'hch.hub.v1',
      storage: createJSONStorage(() => safeStorage),
      // 保存データの形を変えたらここを上げる。migrate を置かないので古い保存分は捨てられる
      version: 1,
      // 版が変わったら保存分は捨てる（そのための merge があるので復元はしない）
      migrate: () => undefined as never,
      partialize: (s) => ({
        seededOn: s.seededOn,
        seedRevision: s.seedRevision,
        announcements: s.announcements,
        knowledge: s.knowledge,
        troubles: s.troubles,
        safetyDrills: s.safetyDrills,
        surveys: s.surveys,
        auditLogs: s.auditLogs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<HubState> | undefined
        // 日付が変わった／モックの版が上がったときは保存分を捨てて作り直す
        if (!p || p.seededOn !== todayKey() || p.seedRevision !== SEED_REVISION) return current
        return { ...current, ...p }
      },
    },
  ),
)

/* --------------------------------------------------------------- セレクタ */

export function useAnnouncements(): Announcement[] {
  const announcements = useHubStore((s) => s.announcements)
  return useMemo(
    () => [...announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [announcements],
  )
}

/**
 * 未読のお知らせ件数。
 * 一覧側が配信対象で絞っているので、バッジも同じ母集団で数える
 * （自分が配信したものは対象外でも自分の一覧に出す）。
 */
export function useUnreadAnnouncementCount(userId: string, department: string): number {
  const announcements = useHubStore((s) => s.announcements)
  return useMemo(
    () =>
      announcements.filter(
        (a) =>
          !a.readUserIds.includes(userId) &&
          isVisibleToUser(a, { id: userId, department }),
      ).length,
    [announcements, userId, department],
  )
}

export function useOpenTroubleCount(): number {
  const troubles = useHubStore((s) => s.troubles)
  return useMemo(() => troubles.filter((t) => t.status !== 'resolved').length, [troubles])
}

export function useActiveDrill(): SafetyDrill | undefined {
  return useHubStore((s) => s.safetyDrills.find((d) => d.active))
}

export function useOpenSurveyCount(): number {
  const surveys = useHubStore((s) => s.surveys)
  return useMemo(() => surveys.filter((s) => s.status === 'open').length, [surveys])
}
