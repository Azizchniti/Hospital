import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FilePlus, CheckSquare, Users, Upload,
  Download, Archive, UsersRound, LogOut, Shield,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/auth/AuthContext'
import { usePatients } from '@/features/patients/hooks'
import { exportToXLSX } from '@/lib/xlsxHandler'
import { Button } from '@/components/ui/Button'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Painel',             adminOnly: false },
  { to: '/nova',      icon: FilePlus,        label: 'Nova Solicitação',   adminOnly: true  },
  { to: '/resposta',  icon: CheckSquare,     label: 'Registrar Resposta', adminOnly: false },
  { to: '/pacientes', icon: Users,           label: 'Pacientes',          adminOnly: false },
  { to: '/importar',  icon: Upload,          label: 'Importar Excel',     adminOnly: true  },
  { to: '/arquivados',icon: Archive,         label: 'Arquivados',         adminOnly: false },
]

const adminNav = [
  { to: '/admin/utilizadores', icon: UsersRound, label: 'Utilizadores' },
]

function UserFooter() {
  const { profile, isAdmin, signOut } = useAuth()

  const initials = (profile?.full_name || profile?.email || '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="px-3 py-4 border-t border-brand-700 space-y-2">
      {/* User info */}
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white truncate">
            {profile?.full_name || 'Utilizador'}
          </p>
          <p className="text-xs text-brand-300 truncate">{profile?.email}</p>
        </div>
        {isAdmin && (
          <Shield className="w-3.5 h-3.5 text-brand-300 shrink-0" />
        )}
      </div>

      {/* Logout */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-brand-200 hover:text-white hover:bg-brand-700 justify-start"
        onClick={() => signOut()}
      >
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: patients = [] } = usePatients()
  const { isAdmin }             = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-brand-800 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-brand-700">
          <div className="text-base font-semibold tracking-tight">Autorização</div>
          <div className="text-xs text-brand-200 mt-0.5">Oncologia</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-brand-100 hover:bg-brand-700 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Admin-only section */}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest">
                  Administração
                </p>
              </div>
              {adminNav.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-brand-600 text-white font-medium'
                      : 'text-brand-100 hover:bg-brand-700 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Export button */}
        <div className="px-3 pt-2 border-t border-brand-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-brand-100 hover:text-white hover:bg-brand-700 justify-start"
            onClick={() => patients.length > 0 && exportToXLSX(patients)}
            disabled={patients.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          <p className="text-xs text-brand-400 mt-1 mb-2 px-1">
            {patients.length} pacientes carregados
          </p>
        </div>

        {/* User footer */}
        <UserFooter />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
