import { RouterProvider } from 'react-router'
import { router } from '@admin/constants/paths'
import '@admin/index.css'
import '@admin/i18n/i18n'

export default function AdminApp() {
  return <RouterProvider router={router} />
}
