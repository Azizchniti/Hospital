import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { NewRequestPage } from '@/pages/NewRequestPage'
import { ResponsePage } from '@/pages/ResponsePage'
import { PatientsPage } from '@/pages/PatientsPage'
import { ImportPage } from '@/pages/ImportPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/"          element={<DashboardPage   />} />
            <Route path="/nova"      element={<NewRequestPage  />} />
            <Route path="/resposta"  element={<ResponsePage    />} />
            <Route path="/pacientes" element={<PatientsPage    />} />
            <Route path="/importar"  element={<ImportPage      />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
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
