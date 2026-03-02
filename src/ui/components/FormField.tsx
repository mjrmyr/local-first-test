interface FormFieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
