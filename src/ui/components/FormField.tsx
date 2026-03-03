interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-muted ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-sm text-error">{error}</p>}
        </div>
    );
}
