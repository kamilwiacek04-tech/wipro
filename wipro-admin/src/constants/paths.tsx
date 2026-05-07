import { createBrowserRouter } from 'react-router'
import App from '@/app/app'
import NotFound from '@/app/not-found'
import AuthLayout from '@/app/auth/_layout'
import SignIn from '@/app/auth/sign-in'
import ProtectedLayout from '@/app/protected/_layout'
import Dashboard from '@/app/protected/dashboard'
import QuoteRequests from '@/app/protected/quoteRequests'
import QuoteRequestDetail from '@/app/protected/quoteRequests/detail'
import Database from '@/app/protected/database'
import AddressBook from '@/app/protected/addressBook'

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
    ],
  },
  { path: '*', element: <NotFound /> },
])
