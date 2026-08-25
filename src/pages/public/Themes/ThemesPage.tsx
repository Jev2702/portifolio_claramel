import { useMemo, useState } from 'react'
import { ThemeGrid } from '../../../components/public/ThemeGrid.tsx'
import { useActiveThemes } from '../../../hooks/use-active-themes.ts'

export function ThemesPage() {
  const { themes, error } = useActiveThemes()
  const [queryText, setQueryText] = useState('')

  const filtered = useMemo(() => {
    if (!themes) {
      return []
    }
    const term = queryText.trim().toLowerCase()
    if (!term) {
      return themes
    }
    return themes.filter((theme) => {
      const category = theme.category?.toLowerCase() ?? ''
      return theme.name.toLowerCase().includes(term) || category.includes(term)
    })
  }, [themes, queryText])

  return (
    <main className="px-4 py-12 md:py-16 max-w-6xl mx-auto w-full">
      <p className="text-secondary text-sm font-semibold uppercase tracking-wider">Catálogo</p>
      <h1 className="font-heading text-title text-4xl tracking-tight mt-2">Temas</h1>
      <p className="text-textSecondary mt-3 max-w-2xl leading-relaxed">
        Escolha o cenário da sua festa. Toque em um tema para ver a montagem completa.
      </p>
      <label htmlFor="search" className="sr-only">
        Buscar tema
      </label>
      <input
        id="search"
        type="search"
        placeholder="Buscar tema..."
        value={queryText}
        onChange={(event) => setQueryText(event.target.value)}
        className="mt-8 w-full max-w-xl rounded-full border border-lavender bg-surface px-5 py-3 min-h-12 shadow-card"
      />
      <div className="mt-10">
        {themes === null ? <p className="text-textSecondary">Carregando temas...</p> : null}
        {error ? (
          <p role="alert" className="text-error">
            {error}
          </p>
        ) : null}
        {themes && filtered.length === 0 && !error ? (
          <p className="text-textSecondary">Nenhum tema encontrado.</p>
        ) : null}
        {filtered.length > 0 ? <ThemeGrid themes={filtered} /> : null}
      </div>
    </main>
  )
}
