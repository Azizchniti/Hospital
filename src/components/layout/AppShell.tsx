import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FilePlus, CheckSquare, Users, Upload, Download, Archive } from 'lucide-react'
import { cn } from '@/utils/cn'
import { usePatients } from '@/features/patients/hooks'
import { exportToXLSX } from '@/lib/xlsxHandler'
import { Button } from '@/components/ui/Button'

const nav = [
  { to: '/',         icon: LayoutDashboard, label: 'Painel'              },
  { to: '/nova',     icon: FilePlus,        label: 'Nova Solicitação'     },
  { to: '/resposta', icon: CheckSquare,     label: 'Registrar Resposta'  },
  { to: '/pacientes',icon: Users,           label: 'Pacientes'            },
  { to: '/importar',   icon: Upload,   label: 'Importar Excel'  },
  { to: '/arquivados', icon: Archive,  label: 'Arquivados'      },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: patients = [] } = usePatients()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-brand-800 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-brand-700">
          <div className="text-base font-semibold tracking-tight">Autorização</div>
          <div className="text-xs text-brand-200 mt-0.5">Oncologia</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
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
        </nav>

        <div className="px-3 py-4 border-t border-brand-700">
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
          <p className="text-xs text-brand-400 mt-2 px-1">
            {patients.length} pacientes carregados
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
