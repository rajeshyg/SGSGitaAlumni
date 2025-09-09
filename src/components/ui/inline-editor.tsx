import * as React from "react"
import { cn } from "../../lib"
import { Button } from "./button"
import { Input } from "./input"
import { Check, X } from "lucide-react"
import type { InlineEditorProps, EditorValue, EditorOptions, ValidationResult } from "./table-types"

interface EditorActionProps {
  saving: boolean
  handleSave: () => void
  onCancel: () => void
}

// Helper function to render action buttons
function renderActionButtons({ saving, handleSave, onCancel }: EditorActionProps) {
  return (
    <>
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
    </>
  )
}

// Helper function for validation
function validateValue(value: string | number, validation?: (val: string | number) => boolean | string): ValidationResult {
  if (!validation) {
    return { isValid: true }
  }

  const result = validation(value)
  if (typeof result === 'string') {
    return { isValid: false, error: result }
  }
  if (result === false) {
    return { isValid: false, error: 'Invalid value' }
  }

  return { isValid: true }
}

function useInlineEditorState(
  value: string | number,
  validation?: (val: string | number) => boolean | string,
  onSave?: (val: string | number) => Promise<void>,
  onCancel?: () => void
) {
  const [editValue, setEditValue] = React.useState<string | number>(value ?? '')
  const [error, setError] = React.useState<string>()
  const [saving, setSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSave = React.useCallback(async () => {
    const currentValue = editValue ?? ''
    const validationResult = validateValue(currentValue, validation)
    if (!validationResult.isValid) {
      setError(validationResult.error)
      return
    }
    setSaving(true)
    try {
      await onSave?.(currentValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [editValue, validation, onSave])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel?.()
    }
  }

  return { editValue, setEditValue, error, saving, inputRef, handleSave, handleKeyDown }
}

export function InlineSelectEditor({
  editValue,
  setEditValue,
  options,
  handleKeyDown,
  className,
  saving,
  handleSave,
  onCancel
}: {
  editValue: EditorValue['value']
  setEditValue: (value: EditorValue['value']) => void
  options: EditorOptions[]
  handleKeyDown: (e: React.KeyboardEvent) => void
  className?: string
  saving: boolean
  handleSave: () => void
  onCancel: () => void
}): React.ReactNode {
  return (
    <div className="flex items-center gap-1">
      <select
        value={editValue ?? ''}
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
      {renderActionButtons({ saving, handleSave, onCancel })}
    </div>
  )
}

export function InlineInputEditor({
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
  editValue: string | number
  setEditValue: (value: string | number) => void
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
      {renderActionButtons({ saving, handleSave, onCancel })}
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
  const { editValue, setEditValue, error, saving, inputRef, handleSave, handleKeyDown } = useInlineEditorState(value, validation, onSave, onCancel)

  const editorProps = {
    editValue: editValue ?? '',
    setEditValue,
    handleKeyDown,
    className,
    saving,
    handleSave,
    onCancel
  }

  if (type === 'select' && options) {
    return <InlineSelectEditor {...editorProps} options={options} />
  }

  return (
    <InlineInputEditor
      {...editorProps}
      type={type}
      error={error}
      inputRef={inputRef}
    />
  )
}