export const THEME_CATEGORIES = [
  'Infantil',
  'Feminino',
  'Masculino',
  'Neutro',
  'Adulto',
] as const

export type ThemeCategory = (typeof THEME_CATEGORIES)[number]

export type Theme = {
  id: string
  name: string
  slug: string
  description: string
  category?: ThemeCategory | string
  coverImage: string
  images: string[]
  active: boolean
  order: number
  rentalCount: number
  weeklyPinned: boolean
  deleted: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

export type ThemeDraft = {
  name: string
  description: string
  category?: string
  coverImage: string
  images: string[]
  active: boolean
  order: number
}
