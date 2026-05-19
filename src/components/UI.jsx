import { X } from 'lucide-react'

// ── Stat Card ──────────────────────────────────────────────────────────────────
export function StatCard({ title, value, sub, icon: Icon, color = 'blue', loading }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    green:   'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {loading
            ? <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1" />
            : <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          }
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ columns, data, loading, emptyMsg = 'No data found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{columns.map(c => <th key={c.key} className="table-th">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading
            ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key} className="table-td">
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? <tr><td colSpan={columns.length} className="py-12 text-center text-gray-400 text-sm">{emptyMsg}</td></tr>
              : data.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-gray-50 transition-colors">
                    {columns.map(c => (
                      <td key={c.key} className="table-td">
                        {c.render ? c.render(row) : row[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  )
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${s[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  )
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'badge-green', INACTIVE: 'badge-gray',
    OUT_OF_STOCK: 'badge-red', DISCONTINUED: 'badge-gray',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status?.replace('_', ' ')}</span>
}

export function UrgencyBadge({ urgency }) {
  const map = { CRITICAL: 'badge-red', HIGH: 'badge-yellow', MEDIUM: 'badge-blue' }
  return <span className={map[urgency] ?? 'badge-gray'}>{urgency}</span>
}

export function TrendBadge({ trend }) {
  const map = {
    STRONG_GROWTH: '🚀 Strong Growth', MODERATE_GROWTH: '📈 Growing',
    STABLE: '➡️ Stable', MODERATE_DECLINE: '📉 Declining', STRONG_DECLINE: '⬇️ Strong Decline',
  }
  const cls = {
    STRONG_GROWTH: 'badge-green', MODERATE_GROWTH: 'badge-green',
    STABLE: 'badge-blue', MODERATE_DECLINE: 'badge-yellow', STRONG_DECLINE: 'badge-red',
  }
  return <span className={cls[trend] ?? 'badge-gray'}>{map[trend] ?? trend}</span>
}

// ── Form Field ────────────────────────────────────────────────────────────────
export function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Currency formatter ────────────────────────────────────────────────────────
export const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)
export const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0)
