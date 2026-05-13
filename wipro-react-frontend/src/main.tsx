import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const isAdmin = window.location.pathname.startsWith('/w-admin')

const AdminApp = lazy(() => import('./admin/AdminApp'))
const ConfiguratorApp = lazy(() => import('./configurator/ConfiguratorApp'))

const App = isAdmin ? AdminApp : ConfiguratorApp

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </StrictMode>,
)
