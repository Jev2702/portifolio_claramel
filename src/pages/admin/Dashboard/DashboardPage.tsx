import { useEffect, useState } from 'react'
import { listAllThemes } from '../../../services/themes/themes-service.ts'
import type { Theme } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function DashboardPage() {
  const [themes, setThemes] = useState<Theme[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listAllThemes()
      .then((items) => {
        if (!cancelled) {
          setThemes(items)
        }
      })
      .catch((cause: unknown) => {
        if (import.meta.env.DEV) {
          console.error(cause)
        }
        if (!cancelled) {
          setError(toUserMessage(cause))
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const total = themes?.length ?? 0
  const active = themes?.filter((theme) => theme.active).length ?? 0
  const inactive = themes?.filter((theme) => !theme.active).length ?? 0

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="font-heading text-title text-3xl mb-6">Dashboard</h1>
      {themes === null && !error ? (
        <p className="text-textSecondary">Carregando temas...</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-error">
          {error}
        </p>
      ) : null}
      {themes ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="bg-surface rounded-card p-6 shadow-sm">
            <p className="font-heading text-title text-4xl">{total}</p>
            <p className="text-textSecondary mt-2">Temas</p>
          </article>
          <article className="bg-surface rounded-card p-6 shadow-sm">
            <p className="font-heading text-title text-4xl">{active}</p>
            <p className="text-textSecondary mt-2">Ativos</p>
          </article>
          <article className="bg-surface rounded-card p-6 shadow-sm">
            <p className="font-heading text-title text-4xl">{inactive}</p>
            <p className="text-textSecondary mt-2">Inativos</p>
          </article>
        </div>
      ) : null}
    </main>
  )
}
