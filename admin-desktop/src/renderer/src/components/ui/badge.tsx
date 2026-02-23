import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-blue-600/20 text-blue-400 border border-blue-500/30',
        vital:       'bg-red-600/20 text-red-400 border border-red-500/30',
        critique:    'bg-orange-600/20 text-orange-400 border border-orange-500/30',
        moyen:       'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
        faible:      'bg-green-600/20 text-green-400 border border-green-500/30',
        nouveau:     'bg-blue-600/20 text-blue-400 border border-blue-500/30',
        en_cours:    'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
        cloture:     'bg-zinc-600/20 text-zinc-400 border border-zinc-500/30',
        outline:     'border border-zinc-700 text-zinc-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => (
  <div className={badgeVariants({ variant, className })} {...props} />
);

export { Badge, badgeVariants };
