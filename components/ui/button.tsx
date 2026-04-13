import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-white text-black hover:bg-white/90': variant === 'primary',
            'border border-border bg-transparent text-foreground hover:bg-card-hover': variant === 'secondary',
            'bg-transparent text-destructive hover:bg-destructive/10': variant === 'destructive',
            'bg-transparent text-foreground hover:bg-card-hover': variant === 'ghost',
          },
          {
            'h-8 px-3 text-xs rounded-sm': size === 'sm',
            'h-9 px-4 text-sm rounded': size === 'md',
            'h-10 px-6 text-sm rounded': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, type ButtonProps }
