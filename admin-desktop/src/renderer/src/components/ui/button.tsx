import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:     'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98]',
        destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 active:scale-[0.98]',
        outline:     'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 active:scale-[0.98]',
        ghost:       'text-zinc-400 hover:text-white hover:bg-zinc-800/60 active:scale-[0.98]',
        secondary:   'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:scale-[0.98]',
        success:     'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-600/20 active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-7 px-3 text-xs',
        lg:      'h-11 px-6 text-base',
        icon:    'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
));
Button.displayName = 'Button';

export { Button, buttonVariants };
