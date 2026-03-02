interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const base =
        'w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
        secondary:
            'border border-navy/15 bg-surface text-foreground hover:bg-canvas active:bg-navy/10',
    };
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
