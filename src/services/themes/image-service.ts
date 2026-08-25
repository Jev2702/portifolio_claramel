export const MAX_IMAGES_PER_THEME = 8
export const MAX_IMAGE_DIMENSION = 1600
export const TARGET_IMAGE_BYTES = 100 * 1024
export const MAX_IMAGE_BYTES = 250 * 1024
export const MAX_DOCUMENT_BYTES = 900 * 1024

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageProcessingError'
  }
}

export function validateImage(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ImageProcessingError(
      'Use uma imagem nos formatos JPEG, PNG ou WebP.',
    )
  }
}

export function estimatePayloadSize(parts: string[]): number {
  return parts.reduce((total, part) => total + part.length, 0)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageProcessingError('Não foi possível processar esta imagem. Tente outro arquivo.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new ImageProcessingError('Não foi possível comprimir esta imagem. Tente outro arquivo.'))
      },
      type,
      quality,
    )
  })
}

async function encodeCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const qualities = [0.82, 0.72, 0.6, 0.48]
  let lastBlob: Blob | null = null

  for (const quality of qualities) {
    try {
      const webp = await canvasToBlob(canvas, 'image/webp', quality)
      lastBlob = webp
      if (webp.size <= TARGET_IMAGE_BYTES) {
        return webp
      }
      if (webp.size <= MAX_IMAGE_BYTES && quality <= 0.6) {
        return webp
      }
    } catch {
      break
    }
  }

  for (const quality of qualities) {
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality)
    lastBlob = jpeg
    if (jpeg.size <= TARGET_IMAGE_BYTES || (jpeg.size <= MAX_IMAGE_BYTES && quality <= 0.6)) {
      return jpeg
    }
  }

  if (lastBlob && lastBlob.size <= MAX_IMAGE_BYTES) {
    return lastBlob
  }

  throw new ImageProcessingError(
    'A imagem ficou grande demais após a compressão. Escolha um arquivo menor.',
  )
}

export async function compressImage(file: File): Promise<Blob> {
  validateImage(file)
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new ImageProcessingError('Não foi possível processar esta imagem. Tente outro arquivo.')
  }
  context.drawImage(image, 0, 0, width, height)
  return encodeCanvas(canvas)
}

export function convertToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new ImageProcessingError('Não foi possível processar esta imagem. Tente outro arquivo.'))
    }
    reader.onerror = () => {
      reject(new ImageProcessingError('Não foi possível processar esta imagem. Tente outro arquivo.'))
    }
    reader.readAsDataURL(blob)
  })
}

export async function processThemeImages(
  files: File[],
  existingImages: string[] = [],
): Promise<string[]> {
  const totalCount = existingImages.length + files.length
  if (totalCount > MAX_IMAGES_PER_THEME) {
    throw new ImageProcessingError(
      `Cada tema pode ter no máximo ${MAX_IMAGES_PER_THEME} imagens.`,
    )
  }

  const processed: string[] = []
  for (const file of files) {
    try {
      const blob = await compressImage(file)
      if (blob.size > MAX_IMAGE_BYTES) {
        throw new ImageProcessingError(
          'A imagem ficou grande demais após a compressão. Escolha um arquivo menor.',
        )
      }
      processed.push(await convertToBase64(blob))
    } catch (error) {
      if (error instanceof ImageProcessingError) {
        throw error
      }
      throw new ImageProcessingError('Não foi possível processar esta imagem. Tente outro arquivo.')
    }
  }

  const allImages = [...existingImages, ...processed]
  if (estimatePayloadSize(allImages) > MAX_DOCUMENT_BYTES) {
    throw new ImageProcessingError(
      'As imagens deste tema ultrapassam o tamanho permitido. Remova algumas ou use arquivos menores.',
    )
  }

  return processed
}
