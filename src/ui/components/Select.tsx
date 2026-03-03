import { forwardRef } from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => (
    <select
        ref={ref}
        className="w-full rounded-xl border border-navy/15 bg-surface px-3 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-canvas"
        {...props}
    />
));

Select.displayName = 'Select';
