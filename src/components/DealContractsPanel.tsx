import { FileSignature, Plus } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { useRegionalFormat } from '../lib/useRegionalFormat'
import type { ContractStatus } from '../types'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'void', label: 'Void' },
]

export function DealContractsPanel({ dealId }: { dealId: string }) {
  const { formatDate } = useRegionalFormat()
  const { contracts, addContract, updateContract } = useCrm()
  const toast = useToast()
  const dealContracts = contracts.filter((c) => c.dealId === dealId)
  const [title, setTitle] = useState('')
  const [signUrl, setSignUrl] = useState('')

  const create = () => {
    if (!title.trim()) {
      toast.error('Title required')
      return
    }
    addContract({
      dealId,
      title: title.trim(),
      status: 'draft',
      signUrl: signUrl.trim(),
    })
    setTitle('')
    setSignUrl('')
    toast.success('Contract created')
  }

  return (
    <div className="space-y-4">
      <div className="list-item p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-text-muted">New contract</p>
        <div className="space-y-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="E-sign URL (optional)"
            value={signUrl}
            onChange={(e) => setSignUrl(e.target.value)}
            placeholder="https://…"
          />
          <Button onClick={create}>
            <Plus size={16} /> Create contract
          </Button>
        </div>
      </div>
      {dealContracts.length === 0 ? (
        <p className="text-sm text-text-muted">No contracts on this deal yet.</p>
      ) : (
        <ul className="space-y-2">
          {dealContracts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-start gap-2 rounded-lg border border-border px-3 py-2 dark:border-slate-700"
            >
              <FileSignature size={16} className="mt-0.5 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{c.title}</p>
                <p className="text-xs text-text-muted">{formatDate(c.createdAt)}</p>
                {c.signUrl && (
                  <a
                    href={c.signUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Open sign link
                  </a>
                )}
              </div>
              <Select
                label="Status"
                className="w-28"
                value={c.status}
                onChange={(e) =>
                  updateContract(c.id, { status: e.target.value as ContractStatus })
                }
                options={statuses}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
