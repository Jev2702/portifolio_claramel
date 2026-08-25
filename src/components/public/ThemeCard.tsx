import { Link } from 'react-router-dom'
import type { Theme } from '../../types/theme.ts'

type ThemeCardProps = {
  theme: Theme
}

export function ThemeCard({ theme }: ThemeCardProps) {
  return (
    <li>
      <Link
        to={`/tema/${theme.slug}`}
        className="group bg-surface rounded-card shadow-card overflow-hidden flex flex-col h-full transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-lavender">
          <img
            src={theme.coverImage}
            alt={theme.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/45 to-transparent" />
        </div>
        <div className="p-5 flex flex-col gap-2 flex-1">
          {theme.category ? (
            <p className="text-xs uppercase tracking-wider text-secondary font-semibold">{theme.category}</p>
          ) : null}
          <h3 className="font-heading text-title text-xl tracking-tight">{theme.name}</h3>
          <span className="mt-auto pt-3 text-sm font-semibold text-primary">
            Ver tema
          </span>
        </div>
      </Link>
    </li>
  )
}
