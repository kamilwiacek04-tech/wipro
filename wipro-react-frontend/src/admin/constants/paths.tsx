import { createBrowserRouter } from 'react-router'
import App from '@admin/app/app'
import NotFound from '@admin/app/not-found'
import AuthLayout from '@admin/app/auth/_layout'
import SignIn from '@admin/app/auth/sign-in'
import ProtectedLayout from '@admin/app/protected/_layout'
import Dashboard from '@admin/app/protected/dashboard'
import QuoteRequests from '@admin/app/protected/quoteRequests'
import QuoteRequestDetail from '@admin/app/protected/quoteRequests/detail'
import Database from '@admin/app/protected/database'
import AddressBook from '@admin/app/protected/addressBook'
import SettingsPage from '@admin/app/protected/settings'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <SignIn /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/quote-requests', element: <QuoteRequests /> },
      { path: '/quote-requests/:id', element: <QuoteRequestDetail /> },
      { path: '/database', element: <Database /> },
      { path: '/address-book', element: <AddressBook /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
], { basename: '/w-admin' })
