'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            id={id}
            className={cn('peer sr-only', className)}
            {...props}
          />
          <div className="h-4 w-4 rounded-xs border border-border bg-background peer-checked:bg-white peer-checked:border-white flex items-center justify-center transition-colors">
            <Check className="h-3 w-3 text-black opacity-0 peer-checked:opacity-100" />
          </div>
        </div>
        {label && <span className="text-sm text-foreground">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
