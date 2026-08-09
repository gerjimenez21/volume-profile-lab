import type { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
  ariaLabel?: string
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  width = 420,
  ariaLabel,
}: Props) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside
        className="tv-drawer"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
      >
        <header className="tv-drawer-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="tv-icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <XMarkIcon />
          </button>
        </header>
        <div className="tv-drawer-body">{children}</div>
        {footer && <footer className="tv-drawer-footer">{footer}</footer>}
      </aside>
    </>
  )
}
