import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-sm font-semibold text-gray-700">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

export function CardSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 border-b border-gray-100 last:border-0', className)}>
      {children}
    </div>
  )
}
