import { APP_CONFIG } from '../config/app-config.ts'

export function hasWhatsApp(): boolean {
  return APP_CONFIG.whatsapp.length > 0
}

export function hasInstagram(): boolean {
  return APP_CONFIG.instagram.length > 0
}

export function themeWhatsAppUrl(themeName: string): string {
  const text = encodeURIComponent(`Olá! Gostaria de saber mais sobre o tema "${themeName}".`)
  return `https://wa.me/${APP_CONFIG.whatsapp}?text=${text}`
}

export function instagramUrl(): string {
  const handle = APP_CONFIG.instagram.replace(/^@/, '')
  return `https://instagram.com/${handle}`
}
