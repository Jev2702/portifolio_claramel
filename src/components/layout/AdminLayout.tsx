import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo/claramel-logo.png'
import { APP_CONFIG } from '../../config/app-config.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { toUserMessage } from '../../utils/user-messages.ts'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-12 inline-flex items-center px-3 rounded-button font-semibold ${
    isActive ? 'bg-lavender text-title' : 'text-text hover:bg-grayLight'
  }`

export function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      window.alert(toUserMessage(error))
    }
  }

  return (
    <div className="bg-background min-h-svh">
      <header className="bg-surface border-b border-lavender px-4 py-3 flex flex-wrap items-center gap-4">
        <img src={logo} alt="Claramel" className="h-12 w-auto object-contain" />
        <p className="font-heading text-title font-semibold mr-auto">{APP_CONFIG.name}</p>
        <nav className="flex flex-wrap gap-2" aria-label="Administração">
          <NavLink to="/admin" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/themes" className={linkClass}>
            Temas
          </NavLink>
        </nav>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="min-h-12 px-4 rounded-button border border-lavender text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Sair
        </button>
      </header>
      <Outlet />
    </div>
  )
}
