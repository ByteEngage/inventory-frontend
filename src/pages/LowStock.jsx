import { useEffect, useState } from 'react'
import { predictionApi, productApi } from '../api/client'
import { PageHeader, UrgencyBadge, fmt, fmtNum, Modal, Field } from '../components/UI'
import { AlertTriangle, RefreshCw, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LowStock() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [stockForm, setStockForm] = useState({ type: 'ADD', quantity: '', reason: 'Restocked from supplier' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await predictionApi.alerts()
      setAlerts(res.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openRestock = (alert) => {
    setSelected(alert)
    setStockForm({ type: 'ADD', quantity: alert.suggestedReorderQty, reason: 'Restocked from supplier' })
    setModal('restock')
  }

  const handleRestock = async () => {
    setSaving(true)
    try {
      await productApi.adjustStock(selected.productId, {
        type: stockForm.type,
        quantity: parseInt(stockForm.quantity),
        reason: stockForm.reason,
      })
      toast.success(`Stock adjusted for ${selected.name}`)
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  const critical = alerts.filter(a => a.urgency === 'CRITICAL')
  const high = alerts.filter(a => a.urgency === 'HIGH')
  const medium = alerts.filter(a => a.urgency === 'MEDIUM')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Low Stock Alerts"
        subtitle={`${alerts.length} products need attention`}
        action={<button onClick={load} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>} />

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Critical', count: critical.length, color: 'bg-red-50 border-red-200 text-red-700', dot: 'bg-red-500' },
            { label: 'High',     count: high.length,     color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
            { label: 'Medium',   count: medium.length,   color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500' },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-xl border ${s.color} flex items-center gap-3`}>
              <div className={`w-3 h-3 rounded-full ${s.dot}`} />
              <div>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-xs font-medium">{s.label} Priority</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {loading
        ? <div className="space-y-3">{Array(5).fill(0).map((_,i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}</div>
        : alerts.length === 0
          ? (
            <div className="card p-16 text-center">
              <Package size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="font-semibold text-gray-500">All stocked up!</p>
              <p className="text-sm text-gray-400 mt-1">No products are below their reorder level</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.productId}
                  className={`card p-5 border-l-4 ${
                    alert.urgency === 'CRITICAL' ? 'border-l-red-500' :
                    alert.urgency === 'HIGH'     ? 'border-l-amber-500' :
                                                   'border-l-blue-400'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UrgencyBadge urgency={alert.urgency} />
                        <span className="text-xs text-gray-400 font-mono">{alert.sku}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{alert.name}</h3>
                      <p className="text-sm text-gray-500">{alert.category}</p>

                      {/* Stock bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Current: <strong className={alert.currentQuantity === 0 ? 'text-red-600' : 'text-gray-900'}>{fmtNum(alert.currentQuantity)}</strong> units</span>
                          <span>Reorder at: <strong>{fmtNum(alert.reorderLevel)}</strong> units</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${alert.currentQuantity === 0 ? 'bg-red-500' : alert.urgency === 'HIGH' ? 'bg-amber-500' : 'bg-blue-400'}`}
                            style={{ width: `${Math.min(100, (alert.currentQuantity / (alert.reorderLevel * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {alert.supplierEmail && (
                        <p className="text-xs text-gray-400 mt-2">
                          Supplier: <a href={`mailto:${alert.supplierEmail}?subject=Restock Request: ${alert.name}&body=Hi, we need to restock ${alert.name} (SKU: ${alert.sku}). Suggested quantity: ${alert.suggestedReorderQty} units.`}
                            className="text-blue-600 hover:underline">{alert.supplierEmail}</a>
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-400 mb-1">Suggested order</div>
                      <div className="text-xl font-bold text-gray-900">{fmtNum(alert.suggestedReorderQty)}</div>
                      <div className="text-xs text-gray-400">units</div>
                      <button onClick={() => openRestock(alert)} className="btn-primary mt-3 text-xs px-3 py-1.5">
                        <Package size={13} /> Restock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Restock Modal */}
      <Modal open={modal === 'restock'} onClose={() => setModal(null)} title={`Restock — ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm grid grid-cols-2 gap-2">
            <div><span className="text-gray-500">Current:</span> <strong>{fmtNum(selected?.currentQuantity)}</strong></div>
            <div><span className="text-gray-500">Reorder at:</span> <strong>{fmtNum(selected?.reorderLevel)}</strong></div>
          </div>
          <Field label="Quantity to Add" required>
            <input className="input" type="number" min="1" value={stockForm.quantity}
              onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} />
          </Field>
          <Field label="Reason">
            <input className="input" value={stockForm.reason}
              onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleRestock} disabled={saving} className="btn-success">
            {saving ? 'Saving…' : 'Confirm Restock'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
