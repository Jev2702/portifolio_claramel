import logo from '../../assets/logo/claramel-logo.png'
import { APP_CONFIG } from '../../config/app-config.ts'
import { hasInstagram, instagramUrl } from '../../utils/whatsapp.ts'

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-lavender bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-3">
          <img src={logo} alt="Claramel Artigos para festas" className="h-16 w-auto object-contain" />
          <p className="font-heading text-title tracking-tight">{APP_CONFIG.name}</p>
        </div>
        <div className="text-textSecondary text-sm">
          <p>© ClaraMel</p>
          {hasInstagram() ? (
            <a
              href={instagramUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-12 items-center text-primary font-semibold"
            >
              Instagram
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
