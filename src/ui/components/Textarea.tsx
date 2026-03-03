import { forwardRef } from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => (
    <textarea
        ref={ref}
        className="w-full rounded-xl border border-navy/15 bg-surface px-3 py-2.5 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-canvas resize-none"
        {...props}
    />
));

Textarea.displayName = 'Textarea';
