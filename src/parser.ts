import YAML from 'yaml'

type LibraryInfo = {
  name: string
  version: string
  description: Record<string, string>
}

/** key: library name */
type ParseLockFileResult = Record<string, LibraryInfo>

export const parseLockFile = (
  content: string,
  targetLibraries: string[]
): ParseLockFileResult => {
  const lockFile = YAML.parse(content).packages
  const libraries: ParseLockFileResult = {}

  console.log('lockFile', lockFile)

  for (const library of targetLibraries) {
    if (lockFile[library]) {
      libraries[library] = {
        name: library,
        version: lockFile[library].version,
        description: lockFile[library].description
      }
    }
  }

  return libraries
}

export type LibraryDiff =
  | {
      type: 'added'
      updated: LibraryInfo
    }
  | {
      type: 'removed'
      base: LibraryInfo
    }
  | {
      type: 'updated'
      name: LibraryInfo['name']
      diff: DiffInLibraryInfo[]
    }

export const getDiffBetweenLockFiles = (
  targetLibraries: string[],
  base: ParseLockFileResult,
  updated: ParseLockFileResult
): LibraryDiff[] => {
  const diff: LibraryDiff[] = []

  for (const library of targetLibraries) {
    if (base[library] && updated[library]) {
      const diffInfo = getDiffBetweenLibraryInfo(
        base[library],
        updated[library]
      )
      if (diffInfo.length > 0) {
        diff.push({ type: 'updated', name: library, diff: diffInfo })
      }
      continue
    }

    if (base[library]) {
      diff.push({
        type: 'removed',
        base: base[library]
      })
      continue
    }

    if (updated[library]) {
      diff.push({
        type: 'added',
        updated: updated[library]
      })
      continue
    }
  }

  return diff
}

type DiffInLibraryInfo = {
  fieldName: string
  base: string
  updated: string
}

const getDiffBetweenLibraryInfo = (
  base: LibraryInfo,
  updated: LibraryInfo
): DiffInLibraryInfo[] => {
  const diff: DiffInLibraryInfo[] = []

  if (base.version !== updated.version) {
    diff.push({
      fieldName: 'version',
      base: base.version,
      updated: updated.version
    })
  }

  for (const key in base.description) {
    if (base.description[key] !== updated.description[key]) {
      diff.push({
        fieldName: `description.${key}`,
        base: base.description[key],
        updated: updated.description[key]
      })
    }
  }

  return diff
}
