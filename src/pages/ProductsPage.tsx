import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Product } from '../types'
import { formatCurrency } from '../lib/format'

type ProductForm = Omit<Product, 'id'>

const emptyForm: ProductForm = { name: '', sku: '', price: 0 }

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [query, setQuery] = useState('')

  const filtered = products.filter((p) => {
    const q = query.toLowerCase()
    if (!q) return true
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, price: p.price })
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Name and SKU required')
      return
    }
    if (editing) {
      updateProduct(editing.id, form)
      toast.success('Product updated')
    } else {
      addProduct(form)
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

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog for quotes and deal line items"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add product
          </Button>
        }
      />
      <div className="p-8">
        <Input
          label="Search catalog"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or SKU…"
          className="mb-4 max-w-md"
        />
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products"
            description="Add products to build quotes from your catalog."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} /> Add product
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-text-muted dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border dark:border-slate-700">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-text-muted">{p.sku}</td>
                    <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" className="!p-2" onClick={() => openEdit(p)} aria-label="Edit">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" className="!p-2" onClick={() => remove(p)} aria-label="Delete">
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
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit product' : 'New product'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input
            label="Unit price"
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
