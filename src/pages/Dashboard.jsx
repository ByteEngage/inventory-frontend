import { useEffect, useState } from 'react'
import { dashboardApi, saleApi } from '../api/client'
import { StatCard, fmt, fmtNum } from '../components/UI'
import { DollarSign, Package, TrendingUp, AlertTriangle, ShoppingCart, BarChart2, Brain } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6']

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [channelData, setChannelData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      saleApi.byChannel(),
    ]).then(([s, c]) => {
      setSummary(s.data.data)
      const ch = c.data.data
      setChannelData(Object.entries(ch).map(([name, v]) => ({
        name: name.replace('_', ' '), revenue: Number(v.revenue), orders: Number(v.count)
      })))
    }).finally(() => setLoading(false))
  }, [])

  const top = summary?.topSellingProducts ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time inventory & sales overview</p>
      </div>

      {/* AI Insight Banner */}
      {summary?.aiInsight && (
        <div className="mb-6 flex gap-3 items-start px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <Brain size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Insight</span>
            <p className="text-sm text-gray-800 mt-0.5">{summary.aiInsight}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Revenue Today"       value={fmt(summary?.revenueToday)}      icon={DollarSign}     color="blue"   loading={loading} />
        <StatCard title="Revenue This Month"  value={fmt(summary?.revenueThisMonth)}  icon={TrendingUp}     color="green"  loading={loading} />
        <StatCard title="Profit This Month"   value={fmt(summary?.profitThisMonth)}   icon={BarChart2}      color="purple" loading={loading}
          sub={summary ? `${summary.profitMarginThisMonth}% margin` : ''} />
        <StatCard title="Orders Today"        value={fmtNum(summary?.totalSalesToday)} icon={ShoppingCart}  color="amber"  loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Active Products"     value={fmtNum(summary?.activeProducts)}     icon={Package}        color="blue"  loading={loading} />
        <StatCard title="Total Inventory Val" value={fmt(summary?.totalInventoryValue)}   icon={DollarSign}     color="green" loading={loading} />
        <StatCard title="Low Stock Items"     value={fmtNum(summary?.lowStockProducts)}   icon={AlertTriangle}  color="amber" loading={loading} />
        <StatCard title="Out of Stock"        value={fmtNum(summary?.outOfStockProducts)} icon={AlertTriangle}  color="red"   loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Channel */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Channel</h2>
          {channelData.length === 0
            ? <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={channelData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Top Sellers Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top 5 Products — Revenue Share</h2>
          {top.length === 0
            ? <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={top.slice(0,5)} dataKey="totalRevenue" nameKey="productName"
                    cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                      `${name?.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>
                    {top.slice(0,5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Top Selling Products</h2>
          <p className="text-xs text-gray-400">Last 30 days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['#','Product','Category','Units Sold','Revenue','Profit','Margin'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array(5).fill(0).map((_,i) => (
                    <tr key={i}>{Array(7).fill(0).map((_,j) => (
                      <td key={j} className="table-td"><div className="h-4 bg-gray-200 animate-pulse rounded w-20"/></td>
                    ))}</tr>
                  ))
                : top.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-gray-50">
                      <td className="table-td font-bold text-gray-400">#{i+1}</td>
                      <td className="table-td font-medium text-gray-900">{p.productName}</td>
                      <td className="table-td"><span className="badge-blue">{p.category}</span></td>
                      <td className="table-td">{fmtNum(p.totalUnitsSold)}</td>
                      <td className="table-td font-semibold">{fmt(p.totalRevenue)}</td>
                      <td className="table-td text-emerald-600">{fmt(p.totalProfit)}</td>
                      <td className="table-td">
                        <span className={p.profitMargin > 30 ? 'badge-green' : p.profitMargin > 15 ? 'badge-blue' : 'badge-yellow'}>
                          {p.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
