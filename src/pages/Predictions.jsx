import { useEffect, useState } from 'react'
import { predictionApi, productApi } from '../api/client'
import { PageHeader, Modal, TrendBadge, Field, fmt, fmtNum } from '../components/UI'
import { Brain, Zap, TrendingUp, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PERIODS = [
  { value: 'NEXT_7_DAYS',    label: 'Next 7 Days'    },
  { value: 'NEXT_30_DAYS',   label: 'Next 30 Days'   },
  { value: 'NEXT_90_DAYS',   label: 'Next 90 Days'   },
  { value: 'NEXT_6_MONTHS',  label: 'Next 6 Months'  },
  { value: 'NEXT_YEAR',      label: 'Next Year'       },
]

export default function Predictions() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ productId: '', period: 'NEXT_30_DAYS' })
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => { productApi.list({ size: 200 }).then(r => setProducts(r.data.data.content)) }, [])

  const handlePredict = async () => {
    if (!form.productId) { toast.error('Please select a product'); return }
    setLoading(true); setResult(null)
    try {
      const res = await predictionApi.predict({ productId: parseInt(form.productId), period: form.period })
      setResult(res.data.data)
      toast.success('AI prediction generated!')
      loadHistory(form.productId)
    } finally { setLoading(false) }
  }

  const loadHistory = async (pid) => {
    if (!pid) return
    setHistoryLoading(true)
    try {
      const res = await predictionApi.history(pid)
      setHistory(res.data.data)
    } finally { setHistoryLoading(false) }
  }

  const handleProductChange = (e) => {
    setForm(f => ({ ...f, productId: e.target.value }))
    setResult(null)
    if (e.target.value) loadHistory(e.target.value)
    else setHistory([])
  }

  const riskColor = { LOW: 'text-emerald-600 bg-emerald-50', MEDIUM: 'text-amber-600 bg-amber-50', HIGH: 'text-red-600 bg-red-50', CRITICAL: 'text-red-700 bg-red-100' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="AI Sales Forecast"
        subtitle="Claude AI analyzes your sales history and predicts future performance" />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg"><Brain size={18} className="text-blue-600" /></div>
              <h2 className="font-semibold text-gray-900">Configure Prediction</h2>
            </div>
            <div className="space-y-4">
              <Field label="Product" required>
                <select className="input" value={form.productId} onChange={handleProductChange}>
                  <option value="">Select a product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Forecast Period" required>
                <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <button onClick={handlePredict} disabled={loading || !form.productId} className="btn-primary w-full justify-center py-2.5">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing with AI…</> : <><Zap size={16} /> Generate Forecast</>}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Powered by claude-sonnet-4-20250514
            </p>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Past Predictions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historyLoading ? <div className="h-20 bg-gray-100 animate-pulse rounded" />
                  : history.map(h => (
                    <div key={h.id} onClick={() => setResult(h)}
                      className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">{h.period?.replace(/_/g,' ')}</span>
                        <TrendBadge trend={h.trend} />
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">{fmt(h.predictedRevenue)}</div>
                      <div className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="card p-8 flex flex-col items-center justify-center min-h-64">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="font-semibold text-gray-700">Claude is analyzing your data…</p>
              <p className="text-sm text-gray-400 mt-1">Reviewing sales history and market patterns</p>
            </div>
          )}

          {!loading && !result && (
            <div className="card p-8 flex flex-col items-center justify-center min-h-64 text-center">
              <Brain size={48} className="text-gray-200 mb-4" />
              <p className="font-semibold text-gray-500">No prediction yet</p>
              <p className="text-sm text-gray-400 mt-1">Select a product and click Generate Forecast</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">{result.period?.replace(/_/g,' ')}</p>
                    <h2 className="text-xl font-bold mt-1">{result.productName}</h2>
                    <p className="text-blue-200 text-sm">{result.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs">Confidence</p>
                    <p className="text-3xl font-bold">{result.confidenceScore}%</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Predicted Revenue', value: fmt(result.predictedRevenue), icon: '💰', color: 'green' },
                  { label: 'Predicted Profit',  value: fmt(result.predictedProfit),  icon: '📈', color: 'blue'  },
                  { label: 'Units to Sell',     value: fmtNum(result.predictedUnitsSold), icon: '📦', color: 'purple' },
                ].map(m => (
                  <div key={m.label} className="card p-4 text-center">
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Analysis */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Analysis Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Trend</span>
                    <TrendBadge trend={result.trend} />
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Growth Rate</span>
                    <span className={`font-semibold ${parseFloat(result.growthRatePercent) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {parseFloat(result.growthRatePercent) >= 0 ? '+' : ''}{result.growthRatePercent}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Restock Qty</span>
                    <span className="font-semibold text-gray-900">{fmtNum(result.recommendedRestockQty)} units</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Risk Level</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${riskColor[result.riskLevel]}`}>
                      {result.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Data Points</span>
                    <span className="font-semibold text-gray-900">{result.historicalDataPoints} months</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">AI Model</span>
                    <span className="text-xs text-gray-400 font-mono">{result.aiModel?.split('-').slice(0,2).join('-')}</span>
                  </div>
                </div>
              </div>

              {/* AI Rationale */}
              {result.aiRationale && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Rationale</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiRationale}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
