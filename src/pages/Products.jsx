import { useEffect, useState, useCallback } from 'react'
import { productApi } from '../api/client'
import { PageHeader, Modal, StatusBadge, Field, fmt, fmtNum } from '../components/UI'
import { Plus, Search, Edit, Trash2, Package, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const EMPTY_PRODUCT = {
  name:'', sku:'', category:'', description:'', price:'', costPrice:'',
  quantity:'', reorderLevel:'', reorderQuantity:'', supplierName:'',
  supplierEmail:'', location:'', status:'ACTIVE'
}

const toFormValue = (value) => value ?? ''

const toOptional = (value) => {
  const text = String(value ?? '').trim()
  return text === '' ? undefined : text
}

const toRequiredNumber = (value, label, { integer = false, min = 0 } = {}) => {
  const text = String(value ?? '').trim()
  if (text === '') throw new Error(`${label} is required`)
  const parsed = integer ? Number.parseInt(text, 10) : Number.parseFloat(text)
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number`)
  if (parsed < min) throw new Error(`${label} must be at least ${min}`)
  return parsed
}

export default function Products() {
  const { isManager } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'stock' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [stockForm, setStockForm] = useState({ type: 'ADD', quantity: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productApi.list({ page, size: 15, search: search || undefined, category: category || undefined })
      setProducts(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
    } finally { setLoading(false) }
  }, [page, search, category])

  useEffect(() => { load() }, [load])
  useEffect(() => { productApi.categories().then(r => setCategories(r.data.data)) }, [])

  const openCreate = () => { setSelected(null); setForm(EMPTY_PRODUCT); setModal('create') }
  const openEdit = (p) => {
    setSelected(p)
    setForm({
      ...EMPTY_PRODUCT,
      ...p,
      name: toFormValue(p.name),
      sku: toFormValue(p.sku),
      category: toFormValue(p.category),
      description: toFormValue(p.description),
      price: toFormValue(p.price),
      costPrice: toFormValue(p.costPrice),
      quantity: toFormValue(p.quantity),
      reorderLevel: toFormValue(p.reorderLevel),
      reorderQuantity: toFormValue(p.reorderQuantity),
      supplierName: toFormValue(p.supplierName),
      supplierEmail: toFormValue(p.supplierEmail),
      location: toFormValue(p.location),
      status: p.status || 'ACTIVE',
    })
    setModal('edit')
  }
  const openStock = (p) => { setSelected(p); setStockForm({ type: 'ADD', quantity: '', reason: '' }); setModal('stock') }
  const openDelete = (p) => { setSelected(p); setModal('delete') }

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const sku = form.sku.trim().toUpperCase()
      if (!form.name.trim()) throw new Error('Product name is required')
      if (!/^[A-Z0-9-]{4,20}$/.test(sku)) throw new Error('SKU must be 4-20 uppercase letters, numbers, or dashes')
      if (!form.category.trim()) throw new Error('Category is required')

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: toOptional(form.description),
        price: toRequiredNumber(form.price, 'Sale price', { min: 0.01 }),
        costPrice: toRequiredNumber(form.costPrice, 'Cost price'),
        quantity: toRequiredNumber(form.quantity, 'Quantity', { integer: true }),
        reorderLevel: toRequiredNumber(form.reorderLevel, 'Reorder level', { integer: true }),
        reorderQuantity: form.reorderQuantity ? toRequiredNumber(form.reorderQuantity, 'Reorder quantity', { integer: true }) : undefined,
        supplierName: toOptional(form.supplierName),
        supplierEmail: toOptional(form.supplierEmail),
        location: toOptional(form.location),
      }
      if (modal === 'create') {
        await productApi.create({ ...payload, sku })
        toast.success('Product created!')
      } else {
        await productApi.update(selected.id, { ...payload, status: form.status })
        toast.success('Product updated!')
      }
      setModal(null); load()
    } catch (err) {
      if (!err.response) toast.error(err.message)
    } finally { setSaving(false) }
  }

  const handleStock = async () => {
    setSaving(true)
    try {
      await productApi.adjustStock(selected.id, { ...stockForm, quantity: parseInt(stockForm.quantity) })
      toast.success('Stock adjusted!')
      setModal(null); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await productApi.delete(selected.id)
      toast.success('Product deleted')
      setModal(null); load()
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Products" subtitle={`${fmtNum(products.length)} items`}
        action={isManager && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or SKU…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
        <select className="input w-auto" value={category} onChange={e => { setCategory(e.target.value); setPage(0) }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Product','SKU','Category','Price','Cost','Stock','Reorder','Status','Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i}>{Array(9).fill(0).map((_, j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-200 animate-pulse rounded w-20" /></td>
                    ))}</tr>
                  ))
                : products.length === 0
                  ? <tr><td colSpan={9} className="py-16 text-center text-gray-400">No products found</td></tr>
                  : products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td">
                          <div className="font-medium text-gray-900 max-w-xs truncate">{p.name}</div>
                          {p.supplierName && <div className="text-xs text-gray-400">{p.supplierName}</div>}
                        </td>
                        <td className="table-td font-mono text-xs text-gray-600">{p.sku}</td>
                        <td className="table-td"><span className="badge-blue">{p.category}</span></td>
                        <td className="table-td font-semibold">{fmt(p.price)}</td>
                        <td className="table-td text-gray-500">{fmt(p.costPrice)}</td>
                        <td className="table-td">
                          <span className={p.quantity === 0 ? 'text-red-600 font-bold' : p.quantity <= p.reorderLevel ? 'text-amber-600 font-semibold' : 'text-gray-900'}>
                            {fmtNum(p.quantity)}
                          </span>
                        </td>
                        <td className="table-td text-gray-500">{p.reorderLevel}</td>
                        <td className="table-td"><StatusBadge status={p.status} /></td>
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openStock(p)} title="Adjust Stock"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Package size={15} />
                            </button>
                            {isManager && <>
                              <button onClick={() => openEdit(p)} title="Edit"
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <Edit size={15} />
                              </button>
                              <button onClick={() => openDelete(p)} title="Delete"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add New Product' : `Edit — ${selected?.name}`} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Name" required>
            <input className="input" value={form.name} onChange={f('name')} placeholder="Apple MacBook Pro" />
          </Field>
          <Field label="SKU" required hint="4–20 uppercase alphanumeric">
            <input className="input font-mono" value={form.sku} onChange={e => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))} placeholder="MBP-14-M3" disabled={modal === 'edit'} />
          </Field>
          <Field label="Category" required>
            <input className="input" value={form.category} onChange={f('category')} list="cats" placeholder="Electronics" />
            <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={f('status')}>
              {['ACTIVE','INACTIVE','DISCONTINUED','OUT_OF_STOCK'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Sale Price (₹)" required>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={f('price')} placeholder="1999.99" />
          </Field>
          <Field label="Cost Price (₹)" required>
            <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={f('costPrice')} placeholder="1450.00" />
          </Field>
          <Field label="Quantity" required>
            <input className="input" type="number" min="0" value={form.quantity} onChange={f('quantity')} placeholder="50" />
          </Field>
          <Field label="Reorder Level" required>
            <input className="input" type="number" min="0" value={form.reorderLevel} onChange={f('reorderLevel')} placeholder="10" />
          </Field>
          <Field label="Reorder Quantity">
            <input className="input" type="number" min="0" value={form.reorderQuantity} onChange={f('reorderQuantity')} placeholder="25" />
          </Field>
          <Field label="Location">
            <input className="input" value={form.location} onChange={f('location')} placeholder="Shelf A1" />
          </Field>
          <Field label="Supplier Name">
            <input className="input" value={form.supplierName} onChange={f('supplierName')} placeholder="Apple Inc." />
          </Field>
          <Field label="Supplier Email">
            <input className="input" type="email" value={form.supplierEmail} onChange={f('supplierEmail')} placeholder="supply@apple.com" />
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} placeholder="Product description…" />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : modal === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal open={modal === 'stock'} onClose={() => setModal(null)} title={`Adjust Stock — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Current stock:</span>
            <span className="font-bold text-gray-900 ml-2">{fmtNum(selected?.quantity)} units</span>
          </div>
          <Field label="Adjustment Type">
            <select className="input" value={stockForm.type} onChange={e => setStockForm(f => ({ ...f, type: e.target.value }))}>
              <option value="ADD">Add Stock</option>
              <option value="REMOVE">Remove Stock</option>
              <option value="SET">Set Exact Quantity</option>
            </select>
          </Field>
          <Field label="Quantity" required>
            <input className="input" type="number" min="0" value={stockForm.quantity}
              onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
          </Field>
          <Field label="Reason">
            <input className="input" value={stockForm.reason}
              onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))} placeholder="Restocked from supplier" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleStock} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Adjust Stock'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Product" size="sm">
        <p className="text-gray-600 text-sm">
          Are you sure you want to delete <strong>{selected?.name}</strong>?
          It will be removed from active inventory, and sales history will be preserved.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="btn-danger">
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
