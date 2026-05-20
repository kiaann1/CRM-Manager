import { Copy, Link2, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageFrame } from '../components/layout/PageFrame'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { api } from '../lib/api/client'
import { useRegionalFormat } from '../lib/useRegionalFormat'
import type { Product, ProductSpecification } from '../types'

type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

function emptyDraft(): ProductDraft {
  return {
    name: '',
    sku: '',
    price: 0,
    description: '',
    category: '',
    unitOfMeasure: 'ea',
    cost: null,
    barcode: '',
    imageUrl: '',
    status: 'active',
    specifications: [],
  }
}

function draftFromProduct(p: Product): ProductDraft {
  return {
    name: p.name,
    sku: p.sku,
    price: p.price,
    description: p.description,
    category: p.category,
    unitOfMeasure: p.unitOfMeasure,
    cost: p.cost,
    barcode: p.barcode,
    imageUrl: p.imageUrl,
    status: p.status,
    specifications: Array.isArray(p.specifications) ? [...p.specifications] : [],
  }
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, productCatalogToken, refreshWorkspace } = useCrm()
  const { formatCurrency } = useRegionalFormat()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductDraft>(emptyDraft)
  const [query, setQuery] = useState('')
  const [feedBusy, setFeedBusy] = useState(false)

  const catalogUrl = useMemo(() => {
    if (!productCatalogToken) return ''
    const base = api.baseUrl.replace(/\/$/, '')
    if (base) return `${base}/api/public/catalog/${productCatalogToken}`
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/public/catalog/${productCatalogToken}`
    }
    return ''
  }, [productCatalogToken])

  const filtered = products.filter((p) => {
    const q = query.toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyDraft())
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm(draftFromProduct(p))
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Name and SKU required')
      return
    }
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: form.price,
      description: form.description.trim(),
      category: form.category.trim(),
      unitOfMeasure: form.unitOfMeasure.trim() || 'ea',
      cost: form.cost,
      barcode: form.barcode.trim(),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
      specifications: form.specifications.filter((s) => s.name.trim() || s.value.trim()),
    }
    if (editing) {
      updateProduct(editing.id, payload)
      toast.success('Product updated')
    } else {
      addProduct(payload)
      toast.success('Product created')
    }
    setModalOpen(false)
  }

  const remove = (p: Product) => {
    deleteConfirm(toast.askConfirm, p.name, () => {
      deleteProduct(p.id)
      toast.success('Product deleted')
    })
  }

  const setSpec = (index: number, field: keyof ProductSpecification, value: string) => {
    setForm((prev) => {
      const specifications = [...prev.specifications]
      const row = { ...specifications[index], [field]: value }
      specifications[index] = row
      return { ...prev, specifications }
    })
  }

  const addSpecRow = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: '', value: '' }],
    }))
  }

  const removeSpecRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }))
  }

  const enableFeed = async () => {
    setFeedBusy(true)
    try {
      const { url } = await api.createProductCatalogFeed()
      await refreshWorkspace()
      toast.success('Catalog URL created')
      await navigator.clipboard.writeText(url).catch(() => undefined)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create feed')
    } finally {
      setFeedBusy(false)
    }
  }

  const revokeFeed = async () => {
    setFeedBusy(true)
    try {
      await api.deleteProductCatalogFeed()
      await refreshWorkspace()
      toast.success('Public catalog URL revoked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not revoke feed')
    } finally {
      setFeedBusy(false)
    }
  }

  const copyCatalogUrl = async () => {
    if (!catalogUrl) return
    try {
      await navigator.clipboard.writeText(catalogUrl)
      toast.success('URL copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <PageFrame
      title="Products"
      description="ERP-style item master: pricing, specs, and a read-only JSON catalog for your website or storefront."
      accent="amber"
      actions={
        <Button onClick={openCreate}>
          <Plus size={16} /> Add product
        </Button>
      }
    >
      <section className="panel panel-pad mb-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text">Storefront catalog API</h2>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">
              Enable a secret URL that returns <strong className="text-text">active</strong> products as JSON
              (no login). Use it from your marketing site, custom storefront, or automation.{' '}
              <span className="text-text-muted">Cost price is never exposed on the public feed.</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!productCatalogToken ? (
              <Button variant="secondary" disabled={feedBusy} onClick={() => void enableFeed()}>
                <Link2 size={16} /> Create catalog URL
              </Button>
            ) : (
              <>
                <Button variant="secondary" disabled={feedBusy} onClick={() => void enableFeed()}>
                  Regenerate URL
                </Button>
                <Button variant="danger" disabled={feedBusy} onClick={() => void revokeFeed()}>
                  Revoke
                </Button>
              </>
            )}
          </div>
        </div>
        {productCatalogToken && catalogUrl && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/50 p-3 dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all text-xs text-text">{catalogUrl}</code>
            <Button variant="secondary" className="shrink-0" type="button" onClick={() => void copyCatalogUrl()}>
              <Copy size={16} /> Copy
            </Button>
          </div>
        )}
      </section>

      <Input
        label="Search catalog"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name, SKU, category, description…"
        className="mb-4 max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products"
          description="Build your item master with SKUs, costs, and attributes—then wire your site to the catalog JSON endpoint above."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Add product
            </Button>
          }
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">UoM</th>
                <th className="px-4 py-3 font-medium text-right">List</th>
                <th className="px-4 py-3 font-medium text-right">Cost</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-text">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">{p.unitOfMeasure}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right text-sm text-text-muted">
                    {p.cost != null ? formatCurrency(p.cost) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === 'active'
                          ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="!p-2" onClick={() => openEdit(p)} aria-label="Edit">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" className="!p-2 text-rose-600" onClick={() => remove(p)} aria-label="Delete">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        panelClassName="max-w-2xl"
      >
        <div className="max-h-[min(85vh,40rem)] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-3 border-b border-border pb-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Core</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Product['status'] })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'discontinued', label: 'Discontinued' },
                ]}
              />
              <Input
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Subscriptions"
              />
            </div>
          </div>

          <div className="space-y-3 border-b border-border pb-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Pricing & inventory</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="List price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              />
              <Input
                label="Unit cost (internal)"
                type="number"
                min={0}
                step={0.01}
                value={form.cost === null || form.cost === undefined ? '' : form.cost}
                onChange={(e) => {
                  const v = e.target.value
                  setForm({ ...form, cost: v === '' ? null : Number(v) || 0 })
                }}
                placeholder="Optional"
              />
              <Input
                label="Unit of measure"
                value={form.unitOfMeasure}
                onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                placeholder="ea, seat, kg…"
              />
              <Input
                label="Barcode / GTIN"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 border-b border-border pb-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Merchandising</p>
            <Input
              label="Image URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Long description for proposals, PDP, or storefront…"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Specifications</p>
              <Button type="button" variant="secondary" className="!py-1.5 !text-xs" onClick={addSpecRow}>
                <Plus size={14} /> Add row
              </Button>
            </div>
            <p className="text-xs text-text-muted">Attribute rows (e.g. Weight, Material) appear on the public JSON for active items.</p>
            <div className="space-y-2">
              {form.specifications.length === 0 ? (
                <p className="text-sm text-text-muted">No spec rows yet.</p>
              ) : (
                form.specifications.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <Input
                      label="Attribute"
                      className="min-w-[8rem] flex-1"
                      value={row.name}
                      onChange={(e) => setSpec(i, 'name', e.target.value)}
                      placeholder="e.g. Weight"
                    />
                    <Input
                      label="Value"
                      className="min-w-[8rem] flex-1"
                      value={row.value}
                      onChange={(e) => setSpec(i, 'value', e.target.value)}
                      placeholder="e.g. 1.2 kg"
                    />
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" className="!p-2 text-rose-600" onClick={() => removeSpecRow(i)} aria-label="Remove row">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save product</Button>
          </div>
        </div>
      </Modal>
    </PageFrame>
  )
}
