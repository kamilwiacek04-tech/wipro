import { useState, useRef, useEffect } from 'react'
import { cn } from '@admin/lib/utils'

interface InlineEditProps {
  value: string | number
  onSave: (value: string) => void
  type?: 'text' | 'number'
  className?: string
  inputClassName?: string
  unit?: string
}

const InlineEdit = ({ value, onSave, type = 'text', className, inputClassName, unit }: InlineEditProps) => {
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
          'border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full',
          inputClassName,
        )}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className={cn(
        'cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 border border-transparent hover:border-blue-200 transition-colors',
        className,
      )}
      title="Kliknij aby edytować"
    >
      {value ?? '—'}{unit ? ` ${unit}` : ''}
    </span>
  )
}

export default InlineEdit
