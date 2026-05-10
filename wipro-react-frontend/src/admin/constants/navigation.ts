import { Home, FileText, Database, BookUser, Settings } from 'lucide-react'

export const navItems = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: Home, path: '/dashboard' },
  { id: 'quote-requests', labelKey: 'nav.quoteRequests', icon: FileText, path: '/quote-requests' },
  { id: 'database', labelKey: 'nav.database', icon: Database, path: '/database' },
  { id: 'address-book', labelKey: 'nav.addressBook', icon: BookUser, path: '/address-book' },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/settings' },
]
