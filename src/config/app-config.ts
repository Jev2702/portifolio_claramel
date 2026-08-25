const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').trim()

export const APP_CONFIG = {
  name: 'Pegue e Monte ClaraMel',
  whatsapp: whatsappNumber,
  instagram: '',
  description:
    'Catálogo digital dos temas de Pegue e Monte da ClaraMel. Encontre o tema perfeito para a sua festa.',
} as const
