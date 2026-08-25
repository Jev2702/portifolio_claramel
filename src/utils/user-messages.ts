import { ImageProcessingError } from '../services/themes/image-service.ts'

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: string }).code)
  }
  return ''
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ImageProcessingError) {
    return error.message
  }

  switch (errorCode(error)) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
    case 'auth/invalid-login-credentials':
      return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente novamente.'
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.'
    default:
      break
  }

  if (error instanceof Error && !error.message.includes('Firebase') && !error.message.includes('auth/')) {
    return error.message
  }

  return 'Não foi possível concluir esta ação. Tente novamente.'
}
