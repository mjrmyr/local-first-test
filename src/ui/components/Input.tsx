import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
    <input
        ref={ref}
        className="w-full rounded-xl border border-navy/15 bg-surface px-3 py-2.5 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-canvas"
        {...props}
    />
));

Input.displayName = 'Input';
