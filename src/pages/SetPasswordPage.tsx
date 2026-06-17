import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Stethoscope, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type PageState = 'loading' | 'form' | 'success' | 'invalid'

function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula',      ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula',      ok: /[a-z]/.test(password) },
    { label: 'Número ou símbolo',    ok: /[\d!@#$%^&*]/.test(password) },
  ]
  const score = rules.filter(r => r.ok).length

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score
                ? score <= 1 ? 'bg-red-400' : score <= 2 ? 'bg-orange-400' : score <= 3 ? 'bg-yellow-400' : 'bg-brand-500'
                : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {rules.map(r => (
          <li key={r.label} className={cn('text-xs flex items-center gap-1.5', r.ok ? 'text-brand-600' : 'text-gray-400')}>
            <span className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0',
              r.ok ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'
            )}>
              {r.ok ? '✓' : '·'}
            </span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SetPasswordPage() {
  const navigate = useNavigate()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    // Supabase auto-exchanges the invite token from the URL hash.
    // We wait for a session to confirm the invite link is valid.
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setPageState('form')
      } else {
        // Give a brief moment for onAuthStateChange to fire (hash exchange)
        const timer = setTimeout(() => setPageState('invalid'), 2000)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_: string, s: any) => {
            if (s) {
              clearTimeout(timer)
              setPageState('form')
              subscription.unsubscribe()
            }
          }
        )
        return () => { clearTimeout(timer); subscription.unsubscribe() }
      }
    })
  }, [])

  const isStrongEnough = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isStrongEnough) {
      setError('A senha não cumpre os requisitos mínimos.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setPageState('success')
    await supabase.auth.signOut()

    setTimeout(() => {
      navigate('/login', {
        state: { message: 'Senha criada com sucesso! Faça login para continuar.' },
        replace: true,
      })
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-800 rounded-2xl mb-4 shadow-lg">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Autorização Oncologia</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de gestão hospitalar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* Loading state */}
          {pageState === 'loading' && (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">A verificar o link de convite...</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {pageState === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-red-500 text-xl font-bold">!</span>
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Link inválido ou expirado</h2>
              <p className="text-sm text-gray-500 mb-5">
                Este link de convite não é válido. Peça ao administrador para enviar um novo convite.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                Ir para o login
              </Button>
            </div>
          )}

          {/* Success state */}
          {pageState === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Senha criada!</h2>
              <p className="text-sm text-gray-500">A redirecionar para o login...</p>
            </div>
          )}

          {/* Password form */}
          {pageState === 'form' && (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Criar senha</h2>
              <p className="text-sm text-gray-500 mb-6">
                Bem-vindo! Defina uma senha segura para a sua conta.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* New password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className={cn(
                        'w-full px-3 py-2 pr-10 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 border-gray-300'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Confirmar senha</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
                      confirm && password !== confirm ? 'border-red-400' : 'border-gray-300'
                    )}
                  />
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-600">As senhas não coincidem.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  disabled={!isStrongEnough || password !== confirm}
                  className="w-full mt-2"
                >
                  Criar senha e entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
