import { create } from 'zustand'

interface AdminBrief {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
}

interface AdminViewState {
  selectedAdminId: number | null
  admins: AdminBrief[]
  setSelectedAdminId: (id: number | null) => void
  setAdmins: (admins: AdminBrief[]) => void
}

export const adminViewStore = create<AdminViewState>()((set) => ({
  selectedAdminId: null,
  admins: [],
  setSelectedAdminId: (id) => set({ selectedAdminId: id }),
  setAdmins: (admins) => set({ admins }),
}))
