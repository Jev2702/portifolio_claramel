import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ThemeForm } from '../../../components/admin/ThemeForm.tsx'
import { getThemeById, updateTheme } from '../../../services/themes/themes-service.ts'
import type { Theme, ThemeDraft } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function EditThemePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    getThemeById(id)
      .then((item) => {
        if (!cancelled) {
          setTheme(item)
          if (!item) {
            setLoadError('Tema não encontrado.')
          }
        }
      })
      .catch((cause: unknown) => {
        if (import.meta.env.DEV) {
          console.error(cause)
        }
        if (!cancelled) {
          setLoadError(toUserMessage(cause))
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(draft: ThemeDraft) {
    if (!id || !theme) {
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await updateTheme(id, draft, theme.slug)
      navigate('/admin/themes', { replace: true })
    } catch (cause) {
      if (import.meta.env.DEV) {
        console.error(cause)
      }
      setError(toUserMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <main className="p-6">
        <p role="alert" className="text-error mb-4">
          {loadError}
        </p>
        <Link to="/admin/themes" className="text-primary font-semibold">
          Voltar para temas
        </Link>
      </main>
    )
  }

  if (!theme) {
    return (
      <main className="p-6">
        <p className="text-textSecondary">Carregando tema...</p>
      </main>
    )
  }

  const initialValue: ThemeDraft = {
    name: theme.name,
    description: theme.description,
    category: theme.category ?? '',
    coverImage: theme.coverImage,
    images: theme.images,
    active: theme.active,
    order: theme.order,
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="font-heading text-title text-3xl mb-6">Editar tema</h1>
      <ThemeForm
        initialValue={initialValue}
        submitting={submitting}
        error={error}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
      />
    </main>
  )
}
