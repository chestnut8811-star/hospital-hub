/**
 * ルート定義（共通・担当外は変更しない）。
 * 画面の追加が必要になったら、勝手に足さず設計書と合わせてから追加する。
 */
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import type { RouteHandle } from '@/components/layout/routeHandle'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { NotFoundPage } from '@/features/NotFoundPage'
import { AdminPage } from '@/features/admin/AdminPage'
import { AnnouncementDetailPage } from '@/features/announcements/AnnouncementDetailPage'
import { AnnouncementListPage } from '@/features/announcements/AnnouncementListPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { DirectListPage } from '@/features/chat/DirectListPage'
import { GroupListPage } from '@/features/chat/GroupListPage'
import { MyRoomPage } from '@/features/chat/MyRoomPage'
import { NotePage } from '@/features/chat/NotePage'
import { MenuPage } from '@/features/home/MenuPage'
import { AiAssistantPage } from '@/features/knowledge/AiAssistantPage'
import { KnowledgeDetailPage } from '@/features/knowledge/KnowledgeDetailPage'
import { KnowledgePage } from '@/features/knowledge/KnowledgePage'
import { SafetyPage } from '@/features/safety/SafetyPage'
import { SurveyDetailPage } from '@/features/surveys/SurveyDetailPage'
import { SurveyListPage } from '@/features/surveys/SurveyListPage'
import { TroubleDetailPage } from '@/features/trouble/TroubleDetailPage'
import { TroubleListPage } from '@/features/trouble/TroubleListPage'
import { TroubleNewPage } from '@/features/trouble/TroubleNewPage'

const chatHandle: RouteHandle = { fullscreenOnMobile: true }

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/groups" replace /> },
      { path: 'groups', element: <GroupListPage /> },
      { path: 'direct', element: <DirectListPage /> },
      { path: 'chat/:roomId', element: <ChatPage />, handle: chatHandle },
      { path: 'chat/:roomId/note', element: <NotePage />, handle: chatHandle },
      { path: 'myroom', element: <MyRoomPage />, handle: chatHandle },
      { path: 'menu', element: <MenuPage /> },
      { path: 'announcements', element: <AnnouncementListPage /> },
      { path: 'announcements/:announcementId', element: <AnnouncementDetailPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'knowledge/:docId', element: <KnowledgeDetailPage /> },
      { path: 'ai', element: <AiAssistantPage /> },
      { path: 'trouble', element: <TroubleListPage /> },
      { path: 'trouble/new', element: <TroubleNewPage /> },
      { path: 'trouble/:troubleId', element: <TroubleDetailPage /> },
      { path: 'safety', element: <SafetyPage /> },
      { path: 'surveys', element: <SurveyListPage /> },
      { path: 'surveys/:surveyId', element: <SurveyDetailPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'admin/:section', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
