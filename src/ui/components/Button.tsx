interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const base =
        'w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
        secondary:
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100',
    };
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
