import type { Theme } from '../../types/theme.ts'
import { ThemeCard } from './ThemeCard.tsx'

type ThemeGridProps = {
  themes: Theme[]
}

export function ThemeGrid({ themes }: ThemeGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {themes.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} />
      ))}
    </ul>
  )
}
