import { cn } from '@/utils/cn'
import type { GuiaStatus, Situacao, Prazo } from '@/types'

const variants = {
  green:  'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
} as const

type Variant = keyof typeof variants

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// ─── Domain-specific badge helpers ───────────────────────────────────────────

export function StatusBadge({ status }: { status: GuiaStatus | string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    'AUTORIZADA':       { label: 'Autorizada',       variant: 'green'  },
    'EM ANALISE':       { label: 'Em análise',        variant: 'blue'   },
    'SEM AUTORIZAÇÃO':  { label: 'Sem autorização',   variant: 'yellow' },
    'NEGADA':           { label: 'Negada',            variant: 'red'    },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' as Variant }
  return <Badge variant={variant}>{label}</Badge>
}

export function SituacaoBadge({ situacao }: { situacao: Situacao | string }) {
  const map: Record<string, { variant: Variant }> = {
    'SOLICITADO':   { variant: 'blue'   },
    'A SOLICITAR':  { variant: 'orange' },
    'RETIRADO':     { variant: 'gray'   },
  }
  const { variant } = map[situacao] ?? { variant: 'gray' as Variant }
  return <Badge variant={variant}>{situacao}</Badge>
}

export function PrazoBadge({ prazo }: { prazo: Prazo | string | null }) {
  if (!prazo) return null
  const isAlert = prazo === 'ATENÇÃO' || prazo === 'ATENCAO'
  return (
    <Badge variant={isAlert ? 'yellow' : 'green'}>
      {isAlert ? '⚠ Atenção' : '✓ OK'}
    </Badge>
  )
}
