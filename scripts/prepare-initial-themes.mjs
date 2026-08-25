import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourceDir = path.resolve('docs/ProtifolioInicial')
const destDir = path.resolve('public/themes')
const dataFile = path.resolve('src/data/initial-themes.ts')

function sortKey(name) {
  const match = name.match(/at (\d+)\.(\d+)\.(\d+)(?: \((\d+)\))?\.jpeg$/i)
  if (!match) {
    return [99, 99, 99, 99, name]
  }
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4] ?? 0),
    name,
  ]
}

const files = (await readdir(sourceDir))
  .filter((name) => name.toLowerCase().endsWith('.jpeg'))
  .sort((a, b) => {
    const left = sortKey(a)
    const right = sortKey(b)
    for (let i = 0; i < 4; i += 1) {
      if (left[i] !== right[i]) {
        return Number(left[i]) - Number(right[i])
      }
    }
    return String(left[4]).localeCompare(String(right[4]))
  })

await mkdir(destDir, { recursive: true })

const themes = []

for (const [index, fileName] of files.entries()) {
  const number = index + 1
  const slug = `tema-${number}`
  const destName = `${slug}.jpg`
  await copyFile(path.join(sourceDir, fileName), path.join(destDir, destName))

  const imagePath = `/themes/${destName}`
  themes.push({
    id: `seed-${number}`,
    name: `Tema ${number}`,
    slug,
    description: 'Tema de Pegue e Monte ClaraMel. Detalhes serão atualizados em breve.',
    coverImage: imagePath,
    images: [imagePath],
    active: true,
    order: number,
    createdAt: null,
    updatedAt: null,
  })
}

const fileContents = `import type { Theme } from '../types/theme.ts'

export const initialThemes: Theme[] = ${JSON.stringify(themes, null, 2)}
`

await writeFile(dataFile, fileContents, 'utf8')
console.log(`Prepared ${themes.length} themes`)
