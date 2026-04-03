import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

/**
 * Renderiza um componente envolvido em MemoryRouter.
 * Usar em testes de UI de qualquer página que dependa de hooks do react-router-dom
 * (useNavigate, useSearchParams, Link, NavLink).
 */
export function renderWithRouter(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    ...options,
  })
}
