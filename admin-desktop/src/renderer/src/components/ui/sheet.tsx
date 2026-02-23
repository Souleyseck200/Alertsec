import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = '', ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className}`}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'left' | 'right' | 'top' | 'bottom';
}

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className = '', children, ...props }, ref) => {
    const sideClass = {
      right:  'inset-y-0 right-0 h-full w-[420px] data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
      left:   'inset-y-0 left-0 h-full w-[420px] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
      top:    'inset-x-0 top-0 h-auto data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
      bottom: 'inset-x-0 bottom-0 h-auto data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
    }[side];

    return (
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={`fixed z-[1200] flex flex-col bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-2xl shadow-black/60 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-400 ${sideClass} ${className}`}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-2 p-6 border-b border-zinc-800 ${className}`} {...props} />
);

const SheetTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className = '', ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={`text-base font-bold text-white ${className}`} {...props} />
  )
);
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
  ({ className = '', ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={`text-xs text-zinc-400 ${className}`} {...props} />
  )
);
SheetDescription.displayName = DialogPrimitive.Description.displayName;

const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`flex items-center gap-3 p-5 border-t border-zinc-800 mt-auto ${className}`} {...props} />
);

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter };
