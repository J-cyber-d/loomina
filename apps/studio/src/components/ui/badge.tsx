import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white shadow',
        secondary: 'border-[#27272a] bg-[#27272a] text-zinc-300',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        destructive: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
        outline: 'border-[#27272a] text-zinc-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
