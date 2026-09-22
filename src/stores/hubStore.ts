/**
 * チャット以外の院内機能（お知らせ・機器トラブル・ナレッジ・安否確認・アンケート・監査ログ）。
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayKey } from '@/lib/demoDay'
import { uid } from '@/lib/id'
import { safeStorage } from '@/lib/storage'
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
      announcements: seed.announcements,
      knowledge: seed.knowledge,
      troubles: seed.troubles,
      troubleOptions: seed.troubleOptions,
      safetyDrills: seed.safetyDrills,
      surveys: seed.surveys,
      auditLogs: seed.auditLogs,

      markAnnouncementRead: (id) => {
        const me = currentUserId()
        set((s) => ({
          announcements: s.announcements.map((a) =>
            a.id === id && !a.readUserIds.includes(me)
              ? { ...a, readUserIds: [...a.readUserIds, me] }
              : a,
          ),
        }))
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
        const sameDay = get().troubles.filter((t) => t.id.startsWith(`${prefix}-`)).length
        const id = `${prefix}-${String(sameDay + 1).padStart(2, '0')}`
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

        // 指定グループへ自動投稿する（設計書 §18）
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

      setDrillActive: (drillId, active) =>
        set((s) => ({
          safetyDrills: s.safetyDrills.map((d) => (d.id === drillId ? { ...d, active } : d)),
        })),

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

      setSurveyStatus: (surveyId, status) =>
        set((s) => ({
          surveys: s.surveys.map((sv) => (sv.id === surveyId ? { ...sv, status } : sv)),
        })),

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
      partialize: (s) => ({
        seededOn: s.seededOn,
        announcements: s.announcements,
        knowledge: s.knowledge,
        troubles: s.troubles,
        safetyDrills: s.safetyDrills,
        surveys: s.surveys,
        auditLogs: s.auditLogs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<HubState> | undefined
        if (!p || p.seededOn !== todayKey()) return current
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

export function useUnreadAnnouncementCount(userId: string): number {
  const announcements = useHubStore((s) => s.announcements)
  return useMemo(
    () => announcements.filter((a) => !a.readUserIds.includes(userId)).length,
    [announcements, userId],
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
