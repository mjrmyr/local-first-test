export function RunningIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className ?? 'size-5'}>
            <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9.8 8.9 7.24 21.2a.75.75 0 0 0 1.47.3L10.9 13l3.17 2.85.73 5.5a.75.75 0 1 0 1.49-.2l-.8-6a.75.75 0 0 0-.26-.47l-2.6-2.34 1.1-4.72 1.57 1.97a.75.75 0 0 0 .46.27l3.5.6a.75.75 0 1 0 .26-1.48l-3.13-.53-2.26-2.83a.75.75 0 0 0-.2-.17 2.18 2.18 0 0 0-2.87.55L9.97 8.45a.75.75 0 0 0-.16.45Z" />
        </svg>
    );
}
