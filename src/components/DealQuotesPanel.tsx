import { FileText, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { useRegionalFormat } from '../lib/useRegionalFormat'
import type { QuoteStatus } from '../types'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

const statusOptions: { value: QuoteStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export function DealQuotesPanel({ dealId }: { dealId: string }) {
  const { quotes, products, addQuote, updateQuote, deleteQuote } = useCrm()
  const { formatCurrency, formatDate } = useRegionalFormat()
  const toast = useToast()
  const dealQuotes = quotes.filter((q) => q.dealId === dealId)
  const [title, setTitle] = useState('')
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [qty, setQty] = useState(1)

  const productOptions =
    products.length > 0
      ? products.map((p) => ({ value: p.id, label: `${p.name} (${formatCurrency(p.price)})` }))
      : [{ value: '', label: 'No products in catalog' }]

  const create = () => {
    if (!title.trim() || !productId) {
      toast.error('Title and product required')
      return
    }
    const product = products.find((p) => p.id === productId)
    if (!product) return
    addQuote({
      dealId,
      title: title.trim(),
      lines: [{ productId, quantity: qty, unitPrice: product.price }],
      status: 'draft',
    })
    setTitle('')
    toast.success('Quote created')
  }

  const lineTotal = (lines: (typeof dealQuotes)[0]['lines']) =>
    lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  return (
    <div className="space-y-4">
      <div className="list-item p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-text-muted">New quote</p>
        <div className="space-y-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            options={productOptions}
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
          <Button onClick={create} disabled={!products.length}>
            <Plus size={14} /> Create quote
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {dealQuotes.length === 0 ? (
          <p className="text-sm text-text-muted">No quotes for this deal yet.</p>
        ) : (
          dealQuotes.map((q) => (
            <li
              key={q.id}
              className="list-item p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-medium">
                    <FileText size={14} className="text-brand-600" />
                    {q.title}
                  </p>
                  <p className="text-xs text-text-muted">{formatDate(q.createdAt)}</p>
                </div>
                <p className="font-semibold text-brand-600">{formatCurrency(lineTotal(q.lines))}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select
                  label="Status"
                  className="w-36"
                  value={q.status}
                  onChange={(e) => {
                    updateQuote(q.id, { status: e.target.value as QuoteStatus })
                    toast.success('Quote status updated')
                  }}
                  options={statusOptions}
                />
                <Button
                  variant="ghost"
                  className="!px-2 text-rose-600"
                  onClick={() =>
                    deleteConfirm(toast.askConfirm, q.title, () => {
                      deleteQuote(q.id)
                      toast.success('Quote deleted')
                    })
                  }
                  aria-label="Delete quote"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-text-muted">
                {q.lines.map((l, i) => {
                  const p = products.find((x) => x.id === l.productId)
                  return (
                    <li key={i}>
                      {p?.name ?? 'Product'} × {l.quantity} @ {formatCurrency(l.unitPrice)}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
