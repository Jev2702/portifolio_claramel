import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { initialThemes } from '../../data/initial-themes.ts'
import type { Theme, ThemeDraft } from '../../types/theme.ts'
import { db } from '../firebase/firebase.ts'
import { estimatePayloadSize, MAX_DOCUMENT_BYTES } from './image-service.ts'

const THEMES_COLLECTION = 'themes'

type ThemeDocument = {
  name: string
  slug: string
  description: string
  category?: string
  coverImage: string
  images: string[]
  active: boolean
  order: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDate(value: Timestamp | undefined): Date | null {
  return value ? value.toDate() : null
}

function mapTheme(id: string, data: ThemeDocument): Theme {
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    category: data.category,
    coverImage: data.coverImage,
    images: data.images ?? [],
    active: data.active,
    order: data.order,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

function assertPayloadSize(coverImage: string, images: string[]): void {
  const size = estimatePayloadSize([coverImage, ...images])
  if (size > MAX_DOCUMENT_BYTES) {
    throw new Error(
      'As imagens deste tema ultrapassam o tamanho permitido. Remova algumas ou use arquivos menores.',
    )
  }
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const slugQuery = query(
    collection(db, THEMES_COLLECTION),
    where('slug', '==', slug),
    limit(1),
  )
  const snapshot = await getDocs(slugQuery)
  return snapshot.docs.some((item) => item.id !== excludeId)
}

function sortThemes(themes: Theme[]): Theme[] {
  return [...themes].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order
    }
    const leftTime = left.createdAt?.getTime() ?? 0
    const rightTime = right.createdAt?.getTime() ?? 0
    return rightTime - leftTime
  })
}

function mergeThemes(remote: Theme[], includeInactive: boolean): Theme[] {
  const slugs = new Set(remote.map((theme) => theme.slug))
  const seed = initialThemes.filter((theme) => {
    if (slugs.has(theme.slug)) {
      return false
    }
    return includeInactive || theme.active
  })
  return sortThemes([...remote, ...seed])
}

async function fetchRemoteThemes(loader: () => Promise<Theme[]>): Promise<Theme[]> {
  try {
    return await loader()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(error)
    }
    return []
  }
}

export async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'tema'
  let candidate = base
  let suffix = 2
  while (await slugExists(candidate, excludeId)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

export async function listActiveThemes(): Promise<Theme[]> {
  const remote = await fetchRemoteThemes(async () => {
    const activeQuery = query(collection(db, THEMES_COLLECTION), where('active', '==', true))
    const snapshot = await getDocs(activeQuery)
    return snapshot.docs.map((item) => mapTheme(item.id, item.data() as ThemeDocument))
  })
  return mergeThemes(remote, false)
}

export async function listAllThemes(): Promise<Theme[]> {
  const remote = await fetchRemoteThemes(async () => {
    const snapshot = await getDocs(collection(db, THEMES_COLLECTION))
    return snapshot.docs.map((item) => mapTheme(item.id, item.data() as ThemeDocument))
  })
  return mergeThemes(remote, true)
}

export async function getThemeBySlug(slug: string): Promise<Theme | null> {
  const remote = await fetchRemoteThemes(async () => {
    const slugQuery = query(
      collection(db, THEMES_COLLECTION),
      where('slug', '==', slug),
      limit(1),
    )
    const snapshot = await getDocs(slugQuery)
    const document = snapshot.docs[0]
    if (!document) {
      return []
    }
    return [mapTheme(document.id, document.data() as ThemeDocument)]
  })
  if (remote[0]) {
    return remote[0]
  }
  return initialThemes.find((theme) => theme.slug === slug) ?? null
}

export async function getThemeById(id: string): Promise<Theme | null> {
  if (id.startsWith('seed-')) {
    return initialThemes.find((theme) => theme.id === id) ?? null
  }
  try {
    const snapshot = await getDoc(doc(db, THEMES_COLLECTION, id))
    if (!snapshot.exists()) {
      return null
    }
    return mapTheme(snapshot.id, snapshot.data() as ThemeDocument)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(error)
    }
    return initialThemes.find((theme) => theme.id === id) ?? null
  }
}

export async function createTheme(draft: ThemeDraft): Promise<string> {
  assertPayloadSize(draft.coverImage, draft.images)
  const slug = await uniqueSlug(draft.name)
  const reference = await addDoc(collection(db, THEMES_COLLECTION), {
    name: draft.name.trim(),
    slug,
    description: draft.description.trim(),
    category: draft.category?.trim() || null,
    coverImage: draft.coverImage,
    images: draft.images,
    active: draft.active,
    order: draft.order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function updateTheme(
  id: string,
  draft: ThemeDraft,
  currentSlug: string,
): Promise<void> {
  assertPayloadSize(draft.coverImage, draft.images)
  const desiredSlug = slugify(draft.name) || currentSlug
  const slugTaken = desiredSlug !== currentSlug && (await slugExists(desiredSlug, id))
  const slug = slugTaken ? currentSlug : desiredSlug

  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    name: draft.name.trim(),
    slug,
    description: draft.description.trim(),
    category: draft.category?.trim() || null,
    coverImage: draft.coverImage,
    images: draft.images,
    active: draft.active,
    order: draft.order,
    updatedAt: serverTimestamp(),
  })
}

export async function setThemeActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    active,
    updatedAt: serverTimestamp(),
  })
}

export async function deactivateTheme(id: string): Promise<void> {
  await setThemeActive(id, false)
}
