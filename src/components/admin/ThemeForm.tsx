import { useState, type FormEvent } from 'react'
import { THEME_CATEGORIES } from '../../types/theme.ts'
import type { ThemeDraft } from '../../types/theme.ts'
import { ImageUploader } from './ImageUploader.tsx'

type ThemeFormProps = {
  initialValue?: ThemeDraft
  submitting: boolean
  error: string
  submitLabel: string
  onSubmit: (draft: ThemeDraft) => Promise<void>
}

const emptyDraft: ThemeDraft = {
  name: '',
  description: '',
  category: '',
  coverImage: '',
  images: [],
  active: true,
  order: 1,
}

export function ThemeForm({
  initialValue = emptyDraft,
  submitting,
  error,
  submitLabel,
  onSubmit,
}: ThemeFormProps) {
  const [draft, setDraft] = useState<ThemeDraft>(initialValue)
  const [localError, setLocalError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    if (!draft.name.trim() || !draft.description.trim()) {
      setLocalError('Preencha nome e descrição.')
      return
    }
    if (draft.images.length === 0 || !draft.coverImage) {
      setLocalError('Adicione pelo menos uma imagem.')
      return
    }
    await onSubmit({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5 max-w-3xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold">
          Nome *
        </label>
        <input
          id="name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          required
          className="rounded-input border border-lavender px-3 py-3 min-h-12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold">
          Descrição *
        </label>
        <textarea
          id="description"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          required
          rows={5}
          className="rounded-input border border-lavender px-3 py-3"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-semibold">
          Categoria
        </label>
        <select
          id="category"
          value={draft.category ?? ''}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          className="rounded-input border border-lavender px-3 py-3 min-h-12 bg-surface"
        >
          <option value="">Sem categoria</option>
          {THEME_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="order" className="text-sm font-semibold">
          Ordem
        </label>
        <input
          id="order"
          type="number"
          min={1}
          value={draft.order}
          onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) || 1 })}
          className="rounded-input border border-lavender px-3 py-3 min-h-12"
        />
      </div>
      <label className="inline-flex items-center gap-3 min-h-12">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
        />
        Ativo
      </label>
      <ImageUploader
        images={draft.images}
        coverImage={draft.coverImage}
        onChange={(images, coverImage) => setDraft({ ...draft, images, coverImage })}
        onError={setLocalError}
      />
      {localError || error ? (
        <p role="alert" className="text-error">
          {localError || error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-textOnPrimary rounded-button min-h-12 px-4 font-heading font-semibold self-start disabled:opacity-70"
      >
        {submitting ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}
