import type { ReactNode } from 'react'
import './page-state.css'

type PageStateProps = {
  title: string
  description: string
  children?: ReactNode
}

export function PageState({ title, description, children }: PageStateProps) {
  return (
    <section className="page-state">
      <span className="page-state__accent" aria-hidden="true" />
      <h1>{title}</h1>
      <p>{description}</p>
      {children && <div className="page-state__actions">{children}</div>}
    </section>
  )
}
