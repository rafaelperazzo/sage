import { NavLink, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, BarChart2, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePeriodo } from '../../contexts/PeriodoContext'

const NAV_ITEMS = [
  { to: '/map', label: 'SAGE Map', icon: MapPin },
  { to: '/agenda', label: 'SAGE Agenda', icon: Calendar },
  { to: '/report', label: 'SAGE Report', icon: BarChart2 },
]

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { periodo, setPeriodo, periodos, loadingPeriodos } = usePeriodo()

  async function handleSignOut() {
    await signOut()
    navigate('/map')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-gray-800 tracking-tight select-none">
            SAGE
          </span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de período */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 hidden sm:block whitespace-nowrap">
              Período:
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={loadingPeriodos || periodos.length === 0}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loadingPeriodos && <option>Carregando...</option>}
              {periodos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >
              <LogIn size={15} />
              Admin
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
