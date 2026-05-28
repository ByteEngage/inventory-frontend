import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart, Brain,
  AlertTriangle, MessageSquare, LogOut, Menu, X, TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const nav = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/products',   icon: Package,         label: 'Products'     },
  { to: '/sales',      icon: ShoppingCart,    label: 'Sales'        },
  { to: '/predictions',icon: TrendingUp,      label: 'AI Forecast'  },
  { to: '/low-stock',  icon: AlertTriangle,   label: 'Low Stock'    },
  { to: '/ai-chat',    icon: MessageSquare,   label: 'AI Assistant' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx('flex flex-col h-full bg-gray-900 text-white', mobile ? 'w-72' : 'w-64')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-lg">📦</div>
        <div>
          <div className="font-bold text-sm">MVT</div>
          <div className="text-xs text-gray-400">Inventory Management System</div>
        </div>
        {mobile && (
          <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold uppercase">
            {user?.username?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username}</div>
            <div className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Manager'}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900">MVT</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
