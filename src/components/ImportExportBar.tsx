import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { downloadCsv, parseCsv, toCsv } from '../lib/csv'
import { Button } from './ui/Button'

interface ImportExportBarProps {
  entity: 'contacts' | 'leads' | 'deals'
}

export function ImportExportBar({ entity }: ImportExportBarProps) {
  const crm = useCrm()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    if (entity === 'contacts') {
      downloadCsv(
        'contacts.csv',
        toCsv(
          crm.contacts.map((c) => ({
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            title: c.title,
          })),
        ),
      )
    } else if (entity === 'leads') {
      downloadCsv(
        'leads.csv',
        toCsv(
          crm.leads.map((l) => ({
            firstName: l.firstName,
            lastName: l.lastName,
            email: l.email,
            company: l.company,
            score: l.score,
          })),
        ),
      )
    } else {
      downloadCsv(
        'deals.csv',
        toCsv(
          crm.deals.map((d) => ({
            title: d.title,
            value: d.value,
            stage: d.stage,
            expectedClose: d.expectedClose,
          })),
        ),
      )
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCsv(String(reader.result))
      if (entity === 'contacts' || entity === 'leads') {
        crm.importRows(entity, rows)
        toast.success(`Imported ${rows.length} ${entity}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex gap-2">
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload size={16} /> Import CSV
      </Button>
      <Button variant="secondary" onClick={exportData}>
        <Download size={16} /> Export CSV
      </Button>
    </div>
  )
}
