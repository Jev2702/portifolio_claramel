const DEFAULT_WHATSAPP_NUMBER = '5535984065306'

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

const fromEnv = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').trim()
const whatsappNumber = digitsOnly(fromEnv || DEFAULT_WHATSAPP_NUMBER)

export const APP_CONFIG = {
  name: 'Pegue e Monte ClaraMel',
  whatsapp: whatsappNumber,
  instagram: '',
  description:
    'Catálogo digital dos temas de Pegue e Monte da ClaraMel. Encontre o tema perfeito para a sua festa.',
} as const
