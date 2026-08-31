import { Button } from '@admin/components/Button'
import { Card } from '@admin/components/Cards'
import MainHeader from '@admin/components/layout/MainHeader'
import MainLayout from '@admin/components/layout/MainLayout'
import api from '@admin/store/axiosInstance'
import { authStore } from '@admin/store/zustand/authStore'
import { toast } from '@admin/store/zustand/toastStore'
import { Check, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PasswordForm {
  current_password: string
  password: string
  password_confirmation: string
}

const EMPTY_FORM: PasswordForm = { current_password: '', password: '', password_confirmation: '' }

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user } = authStore()
  const [form, setForm] = useState<PasswordForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: Partial<Record<keyof PasswordForm, string>> = {}
    if (!form.current_password) nextErrors.current_password = t('profile.errors.required')
    if (form.password.length < 8) nextErrors.password = t('profile.errors.minLength')
    if (form.password !== form.password_confirmation) nextErrors.password_confirmation = t('profile.errors.mismatch')
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      await api.patch('/auth/password', form)
      setForm(EMPTY_FORM)
      toast.success(t('profile.success'))
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors as Record<string, string[]> | undefined
      if (apiErrors) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])) as Partial<Record<keyof PasswordForm, string>>)
      } else {
        toast.error(err?.response?.data?.message ?? t('profile.error'))
      }
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof PasswordForm, label: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type="password"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
      />
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  )

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('profile.title')} subTitle={user?.email} />
    }>
      <Card className="p-6 gap-0 max-w-md">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">{t('profile.changePassword')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {field('current_password', t('profile.currentPassword'))}
          {field('password', t('profile.newPassword'))}
          {field('password_confirmation', t('profile.confirmPassword'))}
          <Button type="submit" size="sm" disabled={saving} className="self-start">
            <Check className="h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </form>
      </Card>
    </MainLayout>
  )
}

export default ProfilePage
