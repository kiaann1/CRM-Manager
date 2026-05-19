export function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0]!)
  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(',')),
  ].join('\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.match(/("([^"]|"")*"|[^,]*)/g) ?? []
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      let v = values[i] ?? ''
      v = v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()
      row[h] = v
    })
    return row
  })
}
