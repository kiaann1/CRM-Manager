import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from 'lucide-react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'

type ToolbarBtnProps = {
  label: string
  onClick: () => void
  active?: boolean
  children: ReactNode
}

function ToolbarBtn({ label, onClick, active, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-2 transition-colors ${
        active
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
          : 'text-text-muted hover:bg-surface-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const lastExternal = useRef(value)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (value !== lastExternal.current && el.innerHTML !== value) {
      el.innerHTML = value || ''
      lastExternal.current = value
    }
  }, [value])

  const sync = useCallback(() => {
    const html = bodyRef.current?.innerHTML ?? ''
    lastExternal.current = html
    onChange(html)
  }, [onChange])

  const exec = (command: string, val?: string) => {
    bodyRef.current?.focus()
    document.execCommand(command, false, val)
    sync()
  }

  const isEmpty = !value || value === '<br>' || value.replace(/<[^>]*>/g, '').trim() === ''

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="doc-editor-toolbar flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5 dark:border-slate-700">
        <ToolbarBtn label="Undo" onClick={() => exec('undo')}>
          <Undo size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Redo" onClick={() => exec('redo')}>
          <Redo size={16} />
        </ToolbarBtn>
        <span className="mx-1 h-6 w-px bg-border dark:bg-slate-600" aria-hidden />
        <ToolbarBtn label="Bold" onClick={() => exec('bold')}>
          <Bold size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" onClick={() => exec('italic')}>
          <Italic size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Underline" onClick={() => exec('underline')}>
          <Underline size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Strikethrough" onClick={() => exec('strikeThrough')}>
          <Strikethrough size={16} />
        </ToolbarBtn>
        <span className="mx-1 h-6 w-px bg-border dark:bg-slate-600" aria-hidden />
        <ToolbarBtn label="Heading 1" onClick={() => exec('formatBlock', 'h1')}>
          <Heading1 size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Heading 2" onClick={() => exec('formatBlock', 'h2')}>
          <Heading2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Paragraph" onClick={() => exec('formatBlock', 'p')}>
          <span className="text-xs font-semibold">P</span>
        </ToolbarBtn>
        <span className="mx-1 h-6 w-px bg-border dark:bg-slate-600" aria-hidden />
        <ToolbarBtn label="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List size={16} />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={16} />
        </ToolbarBtn>
      </div>

      <div className="relative min-h-0 flex-1">
        {isEmpty && (
          <p className="pointer-events-none absolute left-0 top-0 px-1 py-2 text-base text-text-muted">
            {placeholder}
          </p>
        )}
        <div
          ref={bodyRef}
          contentEditable
          role="textbox"
          aria-multiline
          className="doc-editor-body min-h-[480px] w-full px-1 py-2 text-base leading-relaxed outline-none"
          onInput={sync}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}
