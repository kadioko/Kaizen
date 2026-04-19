import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 text-white shadow-[0_16px_32px_-18px_rgba(15,58,107,0.9)] hover:-translate-y-0.5 hover:bg-navy-700',
        secondary: 'bg-white/80 text-gray-900 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:bg-white dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700',
        outline: 'border border-gray-200 bg-white/50 hover:-translate-y-0.5 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800',
        ghost: 'hover:bg-gray-100/80 dark:hover:bg-gray-800',
        gold: 'bg-gold-400 text-navy-950 shadow-[0_16px_32px_-18px_rgba(212,175,55,0.95)] hover:-translate-y-0.5 hover:bg-gold-300',
        destructive: 'bg-red-500 text-white hover:-translate-y-0.5 hover:bg-red-600',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
