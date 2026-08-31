import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { initialThemes } from '../../data/initial-themes.ts'
import type { Theme, ThemeDraft } from '../../types/theme.ts'
import { db } from '../firebase/firebase.ts'
import { estimatePayloadSize, MAX_DOCUMENT_BYTES } from './image-service.ts'

const THEMES_COLLECTION = 'themes'
const CATALOG_CONFIG_COLLECTION = 'config'
const CATALOG_CONFIG_ID = 'catalog'
export const WEEKLY_HIGHLIGHT_COUNT = 9

type ThemeDocument = {
  name: string
  slug: string
  description: string
  category?: string
  coverImage: string
  images: string[]
  active: boolean
  order: number
  rentalCount?: number
  weeklyPinned?: boolean
  deleted?: boolean
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
    rentalCount: data.rentalCount ?? 0,
    weeklyPinned: data.weeklyPinned ?? false,
    deleted: data.deleted ?? false,
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

function sortByRentalThenOrder(left: Theme, right: Theme): number {
  if (left.rentalCount !== right.rentalCount) {
    return right.rentalCount - left.rentalCount
  }
  return left.order - right.order
}

function mergeThemes(
  remote: Theme[],
  includeInactive: boolean,
  exclusions: { ids: Set<string>; slugs: Set<string> },
): Theme[] {
  const slugs = new Set([...remote.map((theme) => theme.slug), ...exclusions.slugs])
  const ids = new Set([...remote.map((theme) => theme.id), ...exclusions.ids])
  const seed = initialThemes.filter((theme) => {
    if (slugs.has(theme.slug) || ids.has(theme.id)) {
      return false
    }
    return includeInactive || theme.active
  })
  const combined = [...remote, ...seed].filter((theme) => !theme.deleted)
  const visible = includeInactive ? combined : combined.filter((theme) => theme.active)
  return sortThemes(visible)
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

async function fetchAllRemoteThemes(): Promise<Theme[]> {
  return fetchRemoteThemes(async () => {
    const snapshot = await getDocs(collection(db, THEMES_COLLECTION))
    return snapshot.docs.map((item) => mapTheme(item.id, item.data() as ThemeDocument))
  })
}

async function loadExclusions(): Promise<{ ids: Set<string>; slugs: Set<string> }> {
  try {
    const snapshot = await getDoc(doc(db, CATALOG_CONFIG_COLLECTION, CATALOG_CONFIG_ID))
    const data = snapshot.data() as { excludedIds?: string[]; excludedSlugs?: string[] } | undefined
    return {
      ids: new Set(data?.excludedIds ?? []),
      slugs: new Set(data?.excludedSlugs ?? []),
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(error)
    }
    return { ids: new Set(), slugs: new Set() }
  }
}

async function addExclusion(theme: Theme): Promise<void> {
  await setDoc(
    doc(db, CATALOG_CONFIG_COLLECTION, CATALOG_CONFIG_ID),
    {
      excludedIds: arrayUnion(theme.id),
      excludedSlugs: arrayUnion(theme.slug),
    },
    { merge: true },
  )
}

function themeWritePayload(theme: Theme) {
  return {
    name: theme.name,
    slug: theme.slug,
    description: theme.description,
    category: theme.category?.trim() || null,
    coverImage: theme.coverImage,
    images: theme.images,
    active: theme.active,
    order: theme.order,
    rentalCount: theme.rentalCount,
    weeklyPinned: theme.weeklyPinned,
    deleted: theme.deleted,
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

export async function ensureThemeDocument(theme: Theme): Promise<void> {
  const reference = doc(db, THEMES_COLLECTION, theme.id)
  const snapshot = await getDoc(reference)
  if (snapshot.exists()) {
    return
  }
  await setDoc(reference, {
    ...themeWritePayload(theme),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function requireTheme(id: string): Promise<Theme> {
  const theme = await getThemeById(id, true)
  if (!theme) {
    throw new Error('Tema não encontrado.')
  }
  await ensureThemeDocument(theme)
  return theme
}

export async function listActiveThemes(): Promise<Theme[]> {
  const [remote, exclusions] = await Promise.all([
    fetchRemoteThemes(async () => {
      const activeQuery = query(collection(db, THEMES_COLLECTION), where('active', '==', true))
      const snapshot = await getDocs(activeQuery)
      return snapshot.docs
        .map((item) => mapTheme(item.id, item.data() as ThemeDocument))
        .filter((theme) => !theme.deleted)
    }),
    loadExclusions(),
  ])
  return mergeThemes(remote, false, exclusions)
}

export async function listAllThemes(): Promise<Theme[]> {
  const [remote, exclusions] = await Promise.all([fetchAllRemoteThemes(), loadExclusions()])
  return mergeThemes(remote, true, exclusions)
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
  const fromRemote = remote[0]
  if (fromRemote) {
    return fromRemote.deleted ? null : fromRemote
  }
  const exclusions = await loadExclusions()
  if (exclusions.slugs.has(slug)) {
    return null
  }
  return initialThemes.find((theme) => theme.slug === slug) ?? null
}

export async function getThemeById(id: string, includeDeleted = false): Promise<Theme | null> {
  try {
    const snapshot = await getDoc(doc(db, THEMES_COLLECTION, id))
    if (snapshot.exists()) {
      const theme = mapTheme(snapshot.id, snapshot.data() as ThemeDocument)
      if (theme.deleted && !includeDeleted) {
        return null
      }
      return theme
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(error)
    }
  }
  const seed = initialThemes.find((theme) => theme.id === id)
  if (!seed) {
    return null
  }
  const exclusions = await loadExclusions()
  if (exclusions.ids.has(seed.id) || exclusions.slugs.has(seed.slug)) {
    return null
  }
  return seed
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
    rentalCount: 0,
    weeklyPinned: false,
    deleted: false,
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
  const current = await requireTheme(id)
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
    rentalCount: current.rentalCount,
    weeklyPinned: current.weeklyPinned,
    deleted: false,
    updatedAt: serverTimestamp(),
  })
}

export async function setThemeActive(id: string, active: boolean): Promise<void> {
  await requireTheme(id)
  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    active,
    updatedAt: serverTimestamp(),
  })
}

export async function deactivateTheme(id: string): Promise<void> {
  await setThemeActive(id, false)
}

export async function deleteTheme(id: string): Promise<void> {
  const theme = await requireTheme(id)
  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    deleted: true,
    active: false,
    weeklyPinned: false,
    updatedAt: serverTimestamp(),
  })
  await addExclusion(theme)
}

export async function adjustRentalCount(id: string, delta: 1 | -1): Promise<number> {
  const theme = await requireTheme(id)
  const rentalCount = Math.max(0, theme.rentalCount + delta)
  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    rentalCount,
    updatedAt: serverTimestamp(),
  })
  return rentalCount
}

export async function setWeeklyPinned(id: string, weeklyPinned: boolean): Promise<void> {
  await requireTheme(id)
  await updateDoc(doc(db, THEMES_COLLECTION, id), {
    weeklyPinned,
    updatedAt: serverTimestamp(),
  })
}

export async function listWeeklyHighlights(): Promise<Theme[]> {
  const active = await listActiveThemes()
  const pinned = active.filter((theme) => theme.weeklyPinned).sort(sortByRentalThenOrder)
  const unpinned = active.filter((theme) => !theme.weeklyPinned).sort(sortByRentalThenOrder)
  return [...pinned, ...unpinned].slice(0, WEEKLY_HIGHLIGHT_COUNT)
}
