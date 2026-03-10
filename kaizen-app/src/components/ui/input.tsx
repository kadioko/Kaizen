import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:file:text-gray-50 dark:placeholder:text-gray-500',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
