import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className = '', ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={`inline-flex items-center justify-start rounded-xl bg-zinc-900 p-1 gap-1 ${className}`}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className = '', ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200
        text-zinc-500 hover:text-zinc-300
        data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm ${className}`}
      {...props}
    />
  )
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className = '', ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={`mt-4 focus-visible:outline-none ${className}`}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
