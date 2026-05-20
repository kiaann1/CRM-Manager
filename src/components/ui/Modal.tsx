import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useModalPresence } from '../../lib/modalPresence'
import { lockDocumentScroll } from '../../lib/scrollLock'
import { Button } from './Button'

export type ModalStep = {
  id: string
  /** Short label for the step indicator (e.g. "Pricing"). */
  label: string
  content: ReactNode
}

export type ModalSize = 'md' | 'lg'

const SIZE_CLASS: Record<ModalSize, string> = {
  md: 'max-w-[min(100vw-1.5rem,32rem)]',
  lg: 'max-w-[min(100vw-1.5rem,42rem)]',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  footer?: ReactNode
  /** Panel width preset (always capped to viewport). */
  size?: ModalSize
  /** Extra panel classes (merged with size). */
  panelClassName?: string
  /**
   * Multi-step wizard: one step visible at a time; all steps stay mounted (forms keep field values).
   * Use for long modals instead of a tall scroll area.
   */
  steps?: ModalStep[]
  /** Controlled step index (optional). */
  step?: number
  onStepChange?: (step: number) => void
  /** Return false to block Next (e.g. validation). */
  canAdvanceFromStep?: (step: number) => boolean
}

function StepIndicator({ steps, active }: { steps: ModalStep[]; active: number }) {
  return (
    <nav aria-label="Form progress" className="mb-4 shrink-0">
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s.id}
            title={s.label}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= active ? 'bg-brand-600' : 'bg-surface-muted'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Step {active + 1} of {steps.length} — {steps[active]?.label}
      </p>
    </nav>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  panelClassName = '',
  steps,
  step: controlledStep,
  onStepChange,
  canAdvanceFromStep,
}: ModalProps) {
  const [internalStep, setInternalStep] = useState(0)
  const activeStep = controlledStep ?? internalStep
  const setActiveStep = (n: number) => {
    if (onStepChange) onStepChange(n)
    else setInternalStep(n)
  }

  useModalPresence(open)

  useEffect(() => {
    if (!open) return
    const releaseScroll = lockDocumentScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseScroll()
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (controlledStep === undefined) setInternalStep(0)
    else onStepChange?.(0)
  }, [open, controlledStep, onStepChange])

  if (!open) return null

  const isWizard = steps && steps.length > 0
  const lastStep = isWizard ? steps.length - 1 : 0
  const onWizardStep = isWizard ? activeStep : 0
  const canNext = !canAdvanceFromStep || canAdvanceFromStep(onWizardStep)

  const defaultWizardFooter = isWizard ? (
    <>
      <Button
        type="button"
        variant="ghost"
        className="mr-auto !px-2"
        disabled={onWizardStep === 0}
        onClick={() => setActiveStep(Math.max(0, onWizardStep - 1))}
      >
        <ChevronLeft size={18} className="mr-0.5 inline" />
        Back
      </Button>
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      {onWizardStep < lastStep ? (
        <Button
          type="button"
          disabled={!canNext}
          onClick={() => {
            if (!canNext) return
            setActiveStep(onWizardStep + 1)
          }}
        >
          Next
          <ChevronRight size={18} className="ml-0.5 inline" />
        </Button>
      ) : (
        footer ?? null
      )}
    </>
  ) : (
    footer ?? null
  )

  const headerTitle =
    isWizard && steps[onWizardStep]
      ? `${title} — ${steps[onWizardStep].label}`
      : title

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-0 items-center justify-center overflow-hidden overscroll-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative flex min-h-0 w-full ${SIZE_CLASS[size]} max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl bg-surface shadow-xl ${panelClassName}`.trim()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="modal-title" className="min-w-0 flex-1 text-lg font-semibold text-text">
            {headerTitle}
          </h2>
          <Button variant="ghost" className="!p-2 shrink-0" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {isWizard ? (
              <>
                <StepIndicator steps={steps} active={onWizardStep} />
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={i === onWizardStep ? 'block' : 'hidden'}
                    aria-hidden={i !== onWizardStep}
                  >
                    {s.content}
                  </div>
                ))}
              </>
            ) : (
              children
            )}
          </div>
        </div>
        {(defaultWizardFooter || (footer && !isWizard)) && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6 sm:py-4">
            {isWizard ? defaultWizardFooter : footer}
          </div>
        )}
      </div>
    </div>
  )
}
