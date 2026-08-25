import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo/claramel-logo.png'
import { APP_CONFIG } from '../../../config/app-config.ts'
import { useAuth } from '../../../contexts/AuthContext.tsx'
import { toUserMessage } from '../../../utils/user-messages.ts'

export function LoginPage() {
  const { user, loading: authLoading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!authLoading && user) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
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
    <main className="bg-background min-h-svh flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-surface w-full max-w-md rounded-card shadow-md p-8 flex flex-col gap-5"
      >
        <img
          src={logo}
          alt="Claramel Artigos para festas"
          className="h-20 w-auto max-w-[240px] object-contain mx-auto"
        />
        <h1 className="font-heading text-title text-2xl text-center">{APP_CONFIG.name}</h1>
        <p className="text-textSecondary text-center text-sm">Acesso administrativo</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-text">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-input border border-lavender px-3 py-3 min-h-12 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-text">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-input border border-lavender px-3 py-3 min-h-12 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error ? (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-textOnPrimary rounded-button min-h-12 px-4 font-heading font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
