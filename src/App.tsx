import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/routes'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* ヘッダー（56px）を隠さない位置に出す。チャット画面の操作を妨げないため。 */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={3500}
        offset={{ top: 64 }}
        mobileOffset={{ top: 64, left: 12, right: 12 }}
      />
    </>
  )
}
