const ATTR = 'data-scroll-lock-count'

/**
 * Lock background scrolling (e.g. under modals). Ref-counted so nested overlays work.
 * Also sets `overflow: hidden` on `html` so the viewport scrollbar hides; `main` is
 * targeted via CSS when this attribute is present.
 */
export function lockDocumentScroll(): () => void {
  const raw = document.body.getAttribute(ATTR)
  const prev = (raw ? parseInt(raw, 10) : 0) || 0
  document.body.setAttribute(ATTR, String(prev + 1))
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  return () => {
    const r = document.body.getAttribute(ATTR)
    const c = (r ? parseInt(r, 10) : 0) || 0
    const next = Math.max(0, c - 1)
    if (next === 0) {
      document.body.removeAttribute(ATTR)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    } else {
      document.body.setAttribute(ATTR, String(next))
    }
  }
}
