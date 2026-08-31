import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adjustRentalCount,
  deleteTheme,
  listAllThemes,
  setThemeActive,
  setWeeklyPinned,
} from '../../../services/themes/themes-service.ts'
import type { Theme } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[] | null>(null)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function load() {
    setError('')
    try {
      setThemes(await listAllThemes())
    } catch (cause) {
      if (import.meta.env.DEV) {
        console.error(cause)
      }
      setError(toUserMessage(cause))
      setThemes([])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function runAction(id: string, action: () => Promise<void>) {
    setPendingId(id)
    setError('')
    try {
      await action()
      await load()
    } catch (cause) {
      if (import.meta.env.DEV) {
        console.error(cause)
      }
      setError(toUserMessage(cause))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="font-heading text-title text-3xl mr-auto">Temas</h1>
        <Link
          to="/admin/themes/new"
          className="bg-primary text-textOnPrimary rounded-button min-h-12 px-4 inline-flex items-center font-semibold"
        >
          + Novo tema
        </Link>
      </div>
      {themes === null ? <p className="text-textSecondary">Carregando temas...</p> : null}
      {error ? (
        <p role="alert" className="text-error mb-4">
          {error}
        </p>
      ) : null}
      {themes && themes.length === 0 && !error ? (
        <p className="text-textSecondary">Nenhum tema cadastrado.</p>
      ) : null}
      {themes && themes.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {themes.map((theme) => {
            const busy = pendingId === theme.id
            return (
              <li
                key={theme.id}
                className="bg-surface rounded-card p-4 shadow-sm flex flex-col sm:flex-row gap-4"
              >
                <img
                  src={theme.coverImage}
                  alt={theme.name}
                  className="w-full sm:w-28 h-28 object-cover rounded-input"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-title text-xl">{theme.name}</p>
                    {theme.weeklyPinned ? (
                      <span className="text-xs font-semibold uppercase tracking-wider bg-lavender text-title rounded-full px-3 py-1">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                  <p className="text-textSecondary text-sm">
                    {theme.category || 'Sem categoria'} · ordem {theme.order} ·{' '}
                    {theme.active ? 'Ativo' : 'Inativo'}
                  </p>
                  <p className="text-text mt-2 font-semibold">Aluguéis: {theme.rentalCount}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/themes/${theme.id}/edit`}
                    className="min-h-12 px-4 rounded-button border border-lavender inline-flex items-center font-semibold"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction(theme.id, () => setThemeActive(theme.id, !theme.active))}
                    className="min-h-12 px-4 rounded-button border border-lavender font-semibold disabled:opacity-70"
                  >
                    {theme.active ? 'Desabilitar' : 'Habilitar'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction(theme.id, () => setWeeklyPinned(theme.id, !theme.weeklyPinned))}
                    className="min-h-12 px-4 rounded-button border border-lavender font-semibold disabled:opacity-70"
                  >
                    {theme.weeklyPinned ? 'Remover destaque' : 'Destacar'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction(theme.id, async () => { await adjustRentalCount(theme.id, 1) })}
                    className="min-h-12 min-w-12 px-4 rounded-button border border-lavender font-semibold disabled:opacity-70"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={busy || theme.rentalCount === 0}
                    onClick={() => void runAction(theme.id, async () => { await adjustRentalCount(theme.id, -1) })}
                    className="min-h-12 min-w-12 px-4 rounded-button border border-lavender font-semibold disabled:opacity-70"
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Excluir o tema "${theme.name}"? Ele sairá do catálogo e da lista admin. Esta ação não pode ser desfeita.`,
                      )
                      if (!confirmed) {
                        return
                      }
                      void runAction(theme.id, () => deleteTheme(theme.id))
                    }}
                    className="min-h-12 px-4 rounded-button border border-error text-error font-semibold disabled:opacity-70"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </main>
  )
}
