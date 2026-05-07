import * as React from 'react'
import { cn } from '@/lib/utils'
import i18n from '@/i18n/i18n'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-red-100 text-red-700',
  outline: 'border border-input text-foreground',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

export function statusBadge(status: string): BadgeVariant {
  switch (status) {
    case 'new': return 'warning'
    case 'in_progress': return 'info'
    case 'offer_sent': return 'default'
    case 'accepted': return 'success'
    case 'rejected': return 'destructive'
    case 'draft': return 'secondary'
    case 'sent': return 'default'
    default: return 'secondary'
  }
}

export function statusLabel(status: string): string {
  const key = `status.${status}`
  const translated = i18n.t(key)
  return translated !== key ? translated : status
}

export { Badge }
