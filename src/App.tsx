import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from '@/auth/AuthContext'
import { RequireAuth }  from '@/auth/RequireAuth'
import { RequireAdmin } from '@/auth/RequireAdmin'

import { AppShell }       from '@/components/layout/AppShell'
import { LoginPage }      from '@/pages/LoginPage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'
import { DashboardPage }  from '@/pages/DashboardPage'
import { NewRequestPage } from '@/pages/NewRequestPage'
import { ResponsePage }   from '@/pages/ResponsePage'
import { PatientsPage }   from '@/pages/PatientsPage'
import { ImportPage }     from '@/pages/ImportPage'
import { ArquivadosPage } from '@/pages/ArquivadosPage'
import { UsersPage }      from '@/pages/admin/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedApp() {
  return (
    <RequireAuth>
      <AppShell>
        <Routes>
          <Route path="/"          element={<DashboardPage  />} />
          <Route path="/nova"      element={<RequireAdmin><NewRequestPage /></RequireAdmin>} />
          <Route path="/resposta"  element={<ResponsePage   />} />
          <Route path="/pacientes" element={<PatientsPage   />} />
          <Route path="/importar"  element={<RequireAdmin><ImportPage /></RequireAdmin>} />
          <Route path="/arquivados" element={<ArquivadosPage />} />

          {/* Admin-only routes */}
          <Route
            path="/admin/utilizadores"
            element={
              <RequireAdmin>
                <UsersPage />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </RequireAuth>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes — no shell, no auth required */}
            <Route path="/login"        element={<LoginPage       />} />
            <Route path="/set-password" element={<SetPasswordPage />} />

            {/* Everything else requires authentication */}
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontSize: '13px', borderRadius: '8px' },
          success: { iconTheme: { primary: '#1a6b3c', secondary: '#fff' } },
        }}
      />

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
