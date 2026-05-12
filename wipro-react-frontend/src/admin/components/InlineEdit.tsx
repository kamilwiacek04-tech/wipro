import { useState, useRef, useEffect } from 'react'
import { cn } from '@admin/lib/utils'
import { useTranslation } from 'react-i18next'

interface InlineEditProps {
  value: string | number
  onSave: (value: string) => void
  type?: 'text' | 'number'
  className?: string
  inputClassName?: string
  unit?: string
}

const InlineEdit = ({ value, onSave, type = 'text', className, inputClassName, unit }: InlineEditProps) => {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft !== String(value)) {
      onSave(draft)
    }
  }

  const cancel = () => {
    setEditing(false)
    setDraft(String(value))
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        className={cn(
          'border border-amber-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 w-full',
          inputClassName,
        )}
      />
    )
  }

  const isEmpty = value === '' || value === null || value === undefined

  return (
    <span
      onClick={() => { setDraft(isEmpty ? '' : String(value)); setEditing(true) }}
      className={cn(
        'cursor-pointer hover:bg-amber-50 rounded px-1 py-0.5 border border-transparent hover:border-amber-200 transition-colors inline-block min-w-12',
        isEmpty && 'text-gray-300 italic',
        className,
      )}
      title={t('quoteRequests.detail.clickToEdit')}
    >
      {isEmpty ? '—' : `${value}${unit ? ` ${unit}` : ''}`}
    </span>
  )
}

export default InlineEdit
