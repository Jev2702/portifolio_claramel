import { useEffect, useState } from 'react'
import { listActiveThemes } from '../services/themes/themes-service.ts'
import type { Theme } from '../types/theme.ts'
import { toUserMessage } from '../utils/user-messages.ts'

export function useActiveThemes() {
  const [themes, setThemes] = useState<Theme[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listActiveThemes()
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
          toUserMessage(cause)
          setError('Não foi possível carregar os temas. Tente novamente.')
          setThemes([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { themes, error }
}
