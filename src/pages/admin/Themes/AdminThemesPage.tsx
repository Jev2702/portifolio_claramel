import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllThemes, setThemeActive } from '../../../services/themes/themes-service.ts'
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

  async function toggleActive(theme: Theme) {
    setPendingId(theme.id)
    try {
      await setThemeActive(theme.id, !theme.active)
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
          {themes.map((theme) => (
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
                <p className="font-heading text-title text-xl">{theme.name}</p>
                <p className="text-textSecondary text-sm">
                  {theme.category || 'Sem categoria'} · ordem {theme.order} ·{' '}
                  {theme.active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {theme.id.startsWith('seed-') ? (
                  <p className="text-textSecondary text-sm self-center">Catálogo inicial</p>
                ) : (
                  <>
                    <Link
                      to={`/admin/themes/${theme.id}/edit`}
                      className="min-h-12 px-4 rounded-button border border-lavender inline-flex items-center font-semibold"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      disabled={pendingId === theme.id}
                      onClick={() => void toggleActive(theme)}
                      className="min-h-12 px-4 rounded-button border border-lavender font-semibold disabled:opacity-70"
                    >
                      {theme.active ? 'Inativar' : 'Ativar'}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
