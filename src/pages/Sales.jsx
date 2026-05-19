import { useEffect, useState } from 'react'
import { saleApi, productApi } from '../api/client'
import { PageHeader, Modal, Field, fmt, fmtNum } from '../components/UI'
import { Plus, TrendingUp, DollarSign, ShoppingCart, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const CHANNELS = ['IN_STORE','ONLINE','WHOLESALE','MOBILE_APP','THIRD_PARTY']

export default function Sales() {
  const [kpis, setKpis] = useState(null)
  const [topSellers, setTopSellers] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    productId: '', quantitySold: '', unitPrice: '',
    discountPercent: '0', channel: 'IN_STORE',
    customerName: '', customerEmail: '', notes: ''
  })

  const load = async () => {
    setLoading(true)
    try {
      const [k, t, c] = await Promise.all([
        saleApi.kpis(), saleApi.topSellers(8), saleApi.categoryStats()
      ])
      setKpis(k.data.data)
      setTopSellers(t.data.data)
      setCategoryStats(c.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { productApi.list({ size: 200 }).then(r => setProducts(r.data.data.content)) }, [])

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleProductSelect = (e) => {
    const p = products.find(x => x.id === parseInt(e.target.value))
    setForm(prev => ({ ...prev, productId: e.target.value, unitPrice: p ? p.price : '' }))
  }

  const handleRecord = async () => {
    if (!form.productId || !form.quantitySold || !form.unitPrice) {
      toast.error('Product, quantity and price are required'); return
    }
    setSaving(true)
    try {
      await saleApi.record({
        productId: parseInt(form.productId),
        quantitySold: parseInt(form.quantitySold),
        unitPrice: parseFloat(form.unitPrice),
        discountPercent: parseFloat(form.discountPercent || 0),
        channel: form.channel,
        customerName: form.customerName || undefined,
        customerEmail: form.customerEmail || undefined,
        notes: form.notes || undefined,
      })
      toast.success('Sale recorded!')
      setModal(false)
      setForm({ productId:'', quantitySold:'', unitPrice:'', discountPercent:'0', channel:'IN_STORE', customerName:'', customerEmail:'', notes:'' })
      load()
    } finally { setSaving(false) }
  }

  const KpiCard = ({ title, value, icon: Icon, color }) => {
    const colors = { blue:'text-blue-600 bg-blue-50', green:'text-emerald-600 bg-emerald-50', purple:'text-purple-600 bg-purple-50', amber:'text-amber-600 bg-amber-50' }
    return (
      <div className="card p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={22} /></div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          {loading ? <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1" />
            : <p className="text-xl font-bold text-gray-900">{value}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Sales" subtitle="Record sales and track performance"
        action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} /> Record Sale</button>} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Revenue Today"       value={fmt(kpis?.revenueToday)}      icon={DollarSign}  color="blue"   />
        <KpiCard title="Revenue This Month"  value={fmt(kpis?.revenueThisMonth)}  icon={TrendingUp}  color="green"  />
        <KpiCard title="Profit This Month"   value={fmt(kpis?.profitThisMonth)}   icon={BarChart2}   color="purple" />
        <KpiCard title="Orders This Month"   value={fmtNum(kpis?.salesThisMonth)} icon={ShoppingCart}color="amber"  />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Sellers Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Sellers — Revenue (30 days)</h2>
          {loading ? <div className="h-56 bg-gray-100 animate-pulse rounded-lg" />
            : <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topSellers.slice(0,6).map(p => ({
                  name: p.productName.split(' ').slice(0,2).join(' '),
                  revenue: parseFloat(p.totalRevenue)
                }))} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Category Stats */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          <div className="space-y-3">
            {loading
              ? Array(5).fill(0).map((_,i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)
              : categoryStats.map(c => {
                  const total = categoryStats.reduce((s, x) => s + parseFloat(x.revenueThisMonth || 0), 0)
                  const pct = total > 0 ? (parseFloat(c.revenueThisMonth) / total * 100).toFixed(0) : 0
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{c.category}</span>
                        <span className="text-gray-500">{fmt(c.revenueThisMonth)} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Product Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{['Product','Category','Orders','Units','Revenue','Profit','Margin'].map(h =>
                <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(5).fill(0).map((_,i) => (
                <tr key={i}>{Array(7).fill(0).map((_,j) => <td key={j} className="table-td"><div className="h-4 bg-gray-200 animate-pulse rounded w-20"/></td>)}</tr>
              )) : topSellers.map(p => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="table-td font-medium text-gray-900 max-w-xs truncate">{p.productName}</td>
                  <td className="table-td"><span className="badge-blue">{p.category}</span></td>
                  <td className="table-td">{fmtNum(p.totalOrders)}</td>
                  <td className="table-td">{fmtNum(p.totalUnitsSold)}</td>
                  <td className="table-td font-semibold">{fmt(p.totalRevenue)}</td>
                  <td className="table-td text-emerald-600">{fmt(p.totalProfit)}</td>
                  <td className="table-td">
                    <span className={p.profitMargin > 30 ? 'badge-green' : p.profitMargin > 15 ? 'badge-blue' : 'badge-yellow'}>
                      {p.profitMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record New Sale" size="md">
        <div className="space-y-4">
          <Field label="Product" required>
            <select className="input" value={form.productId} onChange={handleProductSelect}>
              <option value="">Select a product…</option>
              {products.filter(p => p.status === 'ACTIVE').map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required>
              <input className="input" type="number" min="1" value={form.quantitySold} onChange={f('quantitySold')} placeholder="1" />
            </Field>
            <Field label="Unit Price (₹)" required>
              <input className="input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={f('unitPrice')} />
            </Field>
            <Field label="Discount %">
              <input className="input" type="number" min="0" max="100" value={form.discountPercent} onChange={f('discountPercent')} />
            </Field>
            <Field label="Channel">
              <select className="input" value={form.channel} onChange={f('channel')}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Customer Name">
            <input className="input" value={form.customerName} onChange={f('customerName')} placeholder="Optional" />
          </Field>
          <Field label="Customer Email">
            <input className="input" type="email" value={form.customerEmail} onChange={f('customerEmail')} placeholder="Optional" />
          </Field>
          {form.productId && form.quantitySold && form.unitPrice && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <span className="text-gray-600">Estimated total: </span>
              <span className="font-bold text-blue-700">
                {fmt(parseFloat(form.unitPrice) * parseInt(form.quantitySold || 0) * (1 - parseFloat(form.discountPercent || 0) / 100))}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleRecord} disabled={saving} className="btn-primary">
            {saving ? 'Recording…' : 'Record Sale'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
