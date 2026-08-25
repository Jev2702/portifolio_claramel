import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { APP_CONFIG } from '../../../config/app-config.ts'
import { getThemeBySlug } from '../../../services/themes/themes-service.ts'
import type { Theme } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'
import { hasWhatsApp, themeWhatsAppUrl } from '../../../utils/whatsapp.ts'

export function ThemeDetailsPage() {
  const { slug } = useParams()
  const [theme, setTheme] = useState<Theme | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) {
      return
    }
    let cancelled = false
    getThemeBySlug(slug)
      .then((item) => {
        if (cancelled) {
          return
        }
        if (!item || !item.active) {
          setTheme(null)
          setError('Tema não encontrado.')
          return
        }
        setTheme(item)
        setActiveImage(item.coverImage)
        document.title = `${item.name} | ${APP_CONFIG.name}`
      })
      .catch((cause: unknown) => {
        if (import.meta.env.DEV) {
          console.error(cause)
        }
        if (!cancelled) {
          setTheme(null)
          setError('Não foi possível carregar os temas. Tente novamente.')
          toUserMessage(cause)
        }
      })
    return () => {
      cancelled = true
      document.title = APP_CONFIG.name
    }
  }, [slug])

  const gallery = useMemo(() => {
    if (!theme) {
      return []
    }
    const unique = [theme.coverImage, ...theme.images.filter((image) => image !== theme.coverImage)]
    return unique
  }, [theme])

  function step(delta: number) {
    const index = gallery.indexOf(activeImage)
    const next = gallery[(index + delta + gallery.length) % gallery.length]
    if (next) {
      setActiveImage(next)
    }
  }

  if (theme === undefined) {
    return (
      <main className="px-4 py-16 max-w-6xl mx-auto">
        <p className="text-textSecondary">Carregando temas...</p>
      </main>
    )
  }

  if (!theme) {
    return (
      <main className="px-4 py-16 max-w-3xl mx-auto">
        <p role="alert" className="text-text mb-4">
          {error || 'Tema não encontrado.'}
        </p>
        <Link to="/temas" className="text-primary font-semibold min-h-12 inline-flex items-center">
          Voltar ao catálogo
        </Link>
      </main>
    )
  }

  return (
    <main className="px-4 py-10 md:py-16 max-w-6xl mx-auto w-full">
      <Link to="/temas" className="text-textSecondary hover:text-title font-semibold min-h-12 inline-flex items-center mb-8">
        ← Voltar ao catálogo
      </Link>
      <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-10 items-start">
        <div className="lg:sticky lg:top-24">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStart === null) {
                return
              }
              const end = event.changedTouches[0]?.clientX ?? touchStart
              const delta = end - touchStart
              if (Math.abs(delta) > 40) {
                step(delta < 0 ? 1 : -1)
              }
              setTouchStart(null)
            }}
            className="block w-full rounded-card overflow-hidden shadow-card bg-surface"
          >
            <img
              src={activeImage}
              alt={theme.name}
              className="w-full aspect-[4/5] object-cover"
            />
          </button>
          {gallery.length > 1 ? (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {gallery.map((image, index) => (
                <button
                  key={`${index}-${image.slice(0, 12)}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`shrink-0 rounded-input overflow-hidden border-2 min-h-12 ${
                    activeImage === image ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${theme.name} ${index + 1}`} className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          {theme.category ? (
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider">{theme.category}</p>
          ) : null}
          <h1 className="font-heading text-title text-4xl tracking-tight mt-2">{theme.name}</h1>
          <p className="text-text mt-5 leading-relaxed whitespace-pre-wrap">{theme.description}</p>
          {hasWhatsApp() ? (
            <a
              href={themeWhatsAppUrl(theme.name)}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center bg-secondary text-textOnPrimary rounded-full min-h-12 px-7 font-heading font-semibold"
            >
              Quero saber mais
            </a>
          ) : null}
        </div>
      </div>
      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={theme.name}
          className="fixed inset-0 bg-title/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute left-4 text-textOnPrimary min-h-12 px-3"
            onClick={(event) => {
              event.stopPropagation()
              step(-1)
            }}
          >
            Anterior
          </button>
          <img src={activeImage} alt={theme.name} className="max-h-full max-w-full object-contain rounded-card" />
          <button
            type="button"
            className="absolute right-4 text-textOnPrimary min-h-12 px-3"
            onClick={(event) => {
              event.stopPropagation()
              step(1)
            }}
          >
            Próxima
          </button>
        </div>
      ) : null}
    </main>
  )
}
