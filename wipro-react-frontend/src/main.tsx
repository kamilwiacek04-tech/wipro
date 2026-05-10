import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

const isAdmin = window.location.pathname.startsWith('/w-admin')

const App = lazy(() =>
  isAdmin
    ? import('./admin/AdminApp')
    : import('./configurator/ConfiguratorApp')
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <App />
    </Suspense>
  </StrictMode>,
)
