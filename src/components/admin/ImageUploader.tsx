import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  ImageProcessingError,
  MAX_IMAGES_PER_THEME,
  processThemeImages,
} from '../../services/themes/image-service.ts'

type ImageUploaderProps = {
  images: string[]
  coverImage: string
  onChange: (images: string[], coverImage: string) => void
  onError: (message: string) => void
}

export function ImageUploader({ images, coverImage, onChange, onError }: ImageUploaderProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) {
      return
    }
    setProcessing(true)
    onError('')
    try {
      const added = await processThemeImages(files, images)
      const nextImages = [...images, ...added]
      const nextCover = coverImage || nextImages[0] || ''
      onChange(nextImages, nextCover)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      onError(
        error instanceof ImageProcessingError
          ? error.message
          : 'Não foi possível processar esta imagem. Tente outro arquivo.',
      )
    } finally {
      setProcessing(false)
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void addFiles(event.target.files)
      event.target.value = ''
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files)
    }
  }

  function removeAt(index: number) {
    const nextImages = images.filter((_, itemIndex) => itemIndex !== index)
    const removed = images[index]
    const nextCover = coverImage === removed ? nextImages[0] ?? '' : coverImage
    onChange(nextImages, nextCover)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-text">Imagens *</p>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`hidden md:flex min-h-32 rounded-card border-2 border-dashed items-center justify-center text-center px-4 cursor-pointer ${
          dragging ? 'border-primary bg-lavender' : 'border-grayMedium bg-grayLight'
        }`}
      >
        {processing ? 'Processando imagens...' : 'Arraste as imagens aqui'}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="block w-full text-sm text-text file:mr-4 file:min-h-12 file:px-4 file:rounded-button file:border-0 file:bg-primary file:text-textOnPrimary file:font-semibold"
        onChange={handleInput}
        disabled={processing || images.length >= MAX_IMAGES_PER_THEME}
      />
      <p className="text-textSecondary text-sm">
        Até {MAX_IMAGES_PER_THEME} imagens. A primeira vira capa automaticamente.
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <li key={`${image.slice(0, 24)}-${index}`} className="bg-surface rounded-card overflow-hidden border border-lavender">
            <img src={image} alt={`Imagem ${index + 1}`} className="h-28 w-full object-cover" />
            <div className="p-2 flex flex-col gap-2">
              {coverImage === image ? (
                <p className="text-xs font-semibold text-title">★ Capa</p>
              ) : (
                <button
                  type="button"
                  className="text-xs min-h-12 font-semibold text-primary"
                  onClick={() => onChange(images, image)}
                >
                  Definir capa
                </button>
              )}
              <button
                type="button"
                className="text-xs min-h-12 font-semibold text-error"
                onClick={() => removeAt(index)}
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
