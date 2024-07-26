import { LibraryDiff } from './parser'

export const createCommentBody = (diff: LibraryDiff[]): string => {
  // markdown table
  const headers = ['Status', 'Library', 'Diff']
  const rows = diff.flatMap((d): string[] => {
    switch (d.type) {
      case 'added':
        return ['ADDED', d.updated.name, '-']
      case 'removed':
        return ['REMOVED', d.base.name, '-']
      case 'updated':
        return [
          'UPDATED',
          d.name,
          d.diff
            .map(e => `${e.fieldName}: ${e.base} -> ${e.updated}`)
            .join('<br>')
        ]
    }
  })

  return `${toMarkdownTableRow(headers)}\n${toMarkdownTableRow(headers.map(() => '---'))}\n${toMarkdownTableRow(rows)}`
}

const toMarkdownTableRow = (row: string[]): string => {
  return `| ${row.join(' | ')} |`
}
