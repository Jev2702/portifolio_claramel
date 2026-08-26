import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logo from '../../assets/logo/claramel-logo.png'
import { WhatsAppQuoteButton } from '../public/WhatsAppQuoteButton.tsx'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-12 inline-flex items-center px-3 text-sm font-semibold tracking-wide ${
    isActive ? 'text-title' : 'text-textSecondary hover:text-title'
  }`

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-lavender">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 min-h-12">
          <img src={logo} alt="Claramel Artigos para festas" className="h-14 w-auto object-contain" />
        </Link>
        <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Principal">
          <NavLink to="/" end className={navLinkClass}>
            Início
          </NavLink>
          <NavLink to="/temas" className={navLinkClass}>
            Temas
          </NavLink>
          <WhatsAppQuoteButton className="ml-3 inline-flex items-center justify-center gap-2 bg-secondary text-textOnPrimary rounded-full min-h-12 px-5 font-heading font-semibold" />
        </nav>
        <button
          type="button"
          className="lg:hidden ml-auto min-h-12 min-w-12 rounded-full border border-lavender flex flex-col items-center justify-center gap-1.5"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Abrir menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="block w-5 h-0.5 bg-title" />
          <span className="block w-5 h-0.5 bg-title" />
          <span className="block w-5 h-0.5 bg-title" />
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-menu"
          className="lg:hidden flex flex-col gap-1 px-4 pb-4"
          aria-label="Principal"
        >
          <NavLink to="/" end className={navLinkClass} onClick={() => setOpen(false)}>
            Início
          </NavLink>
          <NavLink to="/temas" className={navLinkClass} onClick={() => setOpen(false)}>
            Temas
          </NavLink>
          <WhatsAppQuoteButton className="mt-2 inline-flex items-center justify-center gap-2 bg-secondary text-textOnPrimary rounded-full min-h-12 px-5 font-heading font-semibold w-fit" />
        </nav>
      ) : null}
    </header>
  )
}
