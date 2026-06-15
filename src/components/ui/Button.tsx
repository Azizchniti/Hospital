import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-transparent',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg border',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <svg
          aria-hidden="true"
          className={cn('animate-spin h-3.5 w-3.5', !loading && 'hidden')}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
