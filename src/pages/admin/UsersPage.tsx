import { useState } from 'react'
import { UserPlus, Shield, User, MoreVertical, Mail, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import { useAuth } from '@/auth/AuthContext'
import { useProfiles, useInviteUser, useToggleProfileStatus, useChangeProfileRole } from '@/features/admin/hooks'
import type { Profile, UserRole } from '@/types'

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role: UserRole }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase() || '?'

  return (
    <div className={cn(
      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
      role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-gray-100 text-gray-600'
    )}>
      {initials}
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      role === 'admin'
        ? 'bg-brand-100 text-brand-700'
        : 'bg-gray-100 text-gray-600'
    )}>
      {role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role === 'admin' ? 'Administrador' : 'Utilizador'}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    )}>
      {active
        ? <><CheckCircle className="w-3 h-3" /> Ativo</>
        : <><XCircle className="w-3 h-3" /> Inativo</>
      }
    </span>
  )
}

// ─── Action menu ─────────────────────────────────────────────────────────────

function ActionMenu({ profile, currentUserId }: { profile: Profile; currentUserId: string }) {
  const [open, setOpen] = useState(false)
  const toggleStatus    = useToggleProfileStatus()
  const changeRole      = useChangeProfileRole()
  const isSelf          = profile.id === currentUserId

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isSelf}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          isSelf
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        )}
        title={isSelf ? 'Não pode editar a sua própria conta' : 'Ações'}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && !isSelf && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 overflow-hidden">
            {/* Toggle active */}
            <button
              onClick={() => {
                toggleStatus.mutate({ id: profile.id, is_active: !profile.is_active })
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              {profile.is_active
                ? <><XCircle className="w-4 h-4 text-red-500" /><span className="text-red-600">Desativar conta</span></>
                : <><CheckCircle className="w-4 h-4 text-brand-500" /><span className="text-brand-700">Ativar conta</span></>
              }
            </button>

            <div className="border-t border-gray-100 my-1" />

            {/* Change role */}
            {profile.role === 'user' ? (
              <button
                onClick={() => {
                  changeRole.mutate({ id: profile.id, role: 'admin' })
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Shield className="w-4 h-4 text-brand-500" /> Promover a administrador
              </button>
            ) : (
              <button
                onClick={() => {
                  changeRole.mutate({ id: profile.id, role: 'user' })
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <User className="w-4 h-4 text-gray-400" /> Revogar administrador
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const invite = useInviteUser()

  const [email, setEmail]         = useState('')
  const [fullName, setFullName]   = useState('')
  const [role, setRole]           = useState<UserRole>('user')
  const [validationErr, setVErr]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setVErr(null)
    if (!email.includes('@')) { setVErr('Email inválido.'); return }
    if (!fullName.trim())     { setVErr('Nome obrigatório.'); return }

    await invite.mutateAsync({ email: email.trim(), full_name: fullName.trim(), role })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
          <div className="mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-brand-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Convidar utilizador</h2>
            <p className="text-sm text-gray-500 mt-1">
              Um email de convite será enviado com um link para criar a senha.
            </p>
          </div>

          {(validationErr || invite.error) && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {validationErr ?? (invite.error as Error)?.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="colega@hospital.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Nome completo"
              type="text"
              placeholder="Ana Silva"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />

            {/* Role selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Perfil</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                >
                  <option value="user">Utilizador — acesso normal</option>
                  <option value="admin">Administrador — acesso total</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={invite.isPending}
                className="flex-1"
              >
                Enviar convite
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { user: currentUser }                   = useAuth()
  const { data: profiles = [], isLoading }      = useProfiles()
  const [showInvite, setShowInvite]             = useState(false)

  const totalAdmins  = profiles.filter(p => p.role === 'admin').length
  const totalActive  = profiles.filter(p => p.is_active).length

  return (
    <>
      <PageHeader
        title="Gestão de utilizadores"
        subtitle={`${profiles.length} conta${profiles.length !== 1 ? 's' : ''} registada${profiles.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4" />
            Convidar utilizador
          </Button>
        }
      />

      <div className="p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',           value: profiles.length },
            { label: 'Administradores', value: totalAdmins    },
            { label: 'Contas ativas',   value: totalActive    },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Utilizadores</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Nenhum utilizador registado.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowInvite(true)}>
                Convidar o primeiro utilizador
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-50">
                  <th className="text-left px-5 py-3">Utilizador</th>
                  <th className="text-left px-5 py-3">Perfil</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-left px-5 py-3">Criado em</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={profile.full_name || profile.email} role={profile.role} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile.full_name || '—'}
                            {profile.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-gray-400 font-normal">(você)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={profile.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge active={profile.is_active} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {format(new Date(profile.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionMenu profile={profile} currentUserId={currentUser?.id ?? ''} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  )
}
