import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeGrid } from '../../../components/public/ThemeGrid.tsx'
import { WhatsAppQuoteButton } from '../../../components/public/WhatsAppQuoteButton.tsx'
import { APP_CONFIG } from '../../../config/app-config.ts'
import { listWeeklyHighlights } from '../../../services/themes/themes-service.ts'
import { claramelGradients } from '../../../styles/theme.ts'
import type { Theme } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function HomePage() {
  const [highlights, setHighlights] = useState<Theme[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listWeeklyHighlights()
      .then((items) => {
        if (!cancelled) {
          setHighlights(items)
        }
      })
      .catch((cause: unknown) => {
        if (import.meta.env.DEV) {
          console.error(cause)
        }
        if (!cancelled) {
          toUserMessage(cause)
          setError('Não foi possível carregar os temas. Tente novamente.')
          setHighlights([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const featured = highlights ?? []

  return (
    <main>
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div
          className="absolute -top-24 -right-16 h-72 w-72 rounded-full blur-3xl opacity-70"
          style={{ background: claramelGradients.primary[1] }}
          aria-hidden
        />
        <div
          className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full blur-3xl opacity-60"
          style={{ background: claramelGradients.primary[2] }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.3fr_0.9fr] gap-12 items-center">
          <div>
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider">Pegue e Monte</p>
            <h1 className="font-heading text-title text-4xl sm:text-5xl tracking-tight leading-tight mt-3">
              Temas delicados para a festa dos seus sonhos
            </h1>
            <p className="text-text mt-5 text-lg leading-relaxed max-w-xl">
              {APP_CONFIG.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/temas"
                className="inline-flex items-center justify-center border border-lavender text-title rounded-full min-h-12 px-7 font-semibold"
              >
                Ver nossos temas
              </Link>
              <WhatsAppQuoteButton />
            </div>
          </div>
          {featured[0] ? (
            <Link
              to={`/tema/${featured[0].slug}`}
              className="hidden lg:block rounded-card overflow-hidden shadow-card"
            >
              <img
                src={featured[0].coverImage}
                alt={featured[0].name}
                className="w-full aspect-[4/5] object-cover"
              />
            </Link>
          ) : null}
        </div>
      </section>

      <section id="catalogo" className="px-4 py-12 md:py-16 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider">Catálogo</p>
            <h2 className="font-heading text-title text-3xl tracking-tight mt-1">Destaques da semana</h2>
          </div>
          <Link to="/temas" className="text-primary font-semibold min-h-12 inline-flex items-center">
            Ver todos
          </Link>
        </div>
        {highlights === null ? <p className="text-textSecondary">Carregando temas...</p> : null}
        {error ? (
          <p role="alert" className="text-error">
            {error}
          </p>
        ) : null}
        {featured.length > 0 ? <ThemeGrid themes={featured} /> : null}
      </section>
    </main>
  )
}
