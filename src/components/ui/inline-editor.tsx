import * as React from "react"
import { cn } from "../../lib"
import { Button } from "./button"
import { Input } from "./input"
import { Check, X } from "lucide-react"
import type { InlineEditorProps } from "./table-types"

function InlineSelectEditor({
  editValue,
  setEditValue,
  options,
  handleKeyDown,
  className,
  saving,
  handleSave,
  onCancel
}: {
  editValue: any
  setEditValue: (value: any) => void
  options: { value: string | number; label: string }[]
  handleKeyDown: (e: React.KeyboardEvent) => void
  className?: string
  saving: boolean
  handleSave: () => void
  onCancel: () => void
}): React.ReactNode {
  return (
    <div className="flex items-center gap-1">
      <select
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-6 w-full rounded border border-input bg-background px-2 py-1 text-xs",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          className
        )}
        disabled={saving}
        aria-label="Edit select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={handleSave}
        disabled={saving}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

function InlineInputEditor({
  editValue,
  setEditValue,
  type,
  handleKeyDown,
  className,
  saving,
  handleSave,
  onCancel,
  error,
  inputRef
}: {
  editValue: any
  setEditValue: (value: any) => void
  type: string
  handleKeyDown: (e: React.KeyboardEvent) => void
  className?: string
  saving: boolean
  handleSave: () => void
  onCancel: () => void
  error?: string
  inputRef: React.RefObject<HTMLInputElement>
}): React.ReactNode {
  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-6 text-xs",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        disabled={saving}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={handleSave}
        disabled={saving}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-3 w-3" />
      </Button>
      {error && (
        <span className="text-xs text-destructive ml-1">{error}</span>
      )}
    </div>
  )
}

export function InlineEditor({
  value,
  type = 'text',
  options,
  onSave,
  onCancel,
  validation,
  className
}: InlineEditorProps) {
  const [editValue, setEditValue] = React.useState(value)
  const [error, setError] = React.useState<string>()
  const [saving, setSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSave = async () => {
    if (validation) {
      const result = validation(editValue)
      if (typeof result === 'string') {
        setError(result)
        return
      }
      if (!result) {
        setError('Invalid value')
        return
      }
    }

    setSaving(true)
    try {
      await onSave(editValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (type === 'select' && options) {
    return (
      <InlineSelectEditor
        editValue={editValue}
        setEditValue={setEditValue}
        options={options}
        handleKeyDown={handleKeyDown}
        className={className}
        saving={saving}
        handleSave={handleSave}
        onCancel={onCancel}
      />
    )
  }

  return (
    <InlineInputEditor
      editValue={editValue}
      setEditValue={setEditValue}
      type={type}
      handleKeyDown={handleKeyDown}
      className={className}
      saving={saving}
      handleSave={handleSave}
      onCancel={onCancel}
      error={error}
      inputRef={inputRef}
    />
  )
}