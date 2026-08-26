import { APP_CONFIG } from '../config/app-config.ts'

export function hasWhatsApp(): boolean {
  return APP_CONFIG.whatsapp.length > 0
}

export function hasInstagram(): boolean {
  return APP_CONFIG.instagram.length > 0
}

export function quoteWhatsAppUrl(themeName?: string): string {
  const text = themeName
    ? `Olá! Gostaria de fazer um orçamento do tema "${themeName}".`
    : 'Olá! Gostaria de fazer um orçamento.'
  return `https://wa.me/${APP_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`
}

export function themeWhatsAppUrl(themeName: string): string {
  return quoteWhatsAppUrl(themeName)
}

export function instagramUrl(): string {
  const handle = APP_CONFIG.instagram.replace(/^@/, '')
  return `https://instagram.com/${handle}`
}
