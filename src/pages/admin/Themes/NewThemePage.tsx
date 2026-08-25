import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeForm } from '../../../components/admin/ThemeForm.tsx'
import { createTheme } from '../../../services/themes/themes-service.ts'
import type { ThemeDraft } from '../../../types/theme.ts'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function NewThemePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(draft: ThemeDraft) {
    setSubmitting(true)
    setError('')
    try {
      await createTheme(draft)
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

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="font-heading text-title text-3xl mb-6">Novo tema</h1>
      <ThemeForm
        submitting={submitting}
        error={error}
        submitLabel="Salvar tema"
        onSubmit={handleSubmit}
      />
    </main>
  )
}
