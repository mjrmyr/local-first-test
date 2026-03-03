import type { ReactNode } from 'react';
import { BottomNav, TopNav } from './NavBar';

interface LayoutProps {
    children: ReactNode;
}

/**
 * Shell layout for authenticated screens.
 * - Desktop (lg+): top navigation bar, content fills remaining height.
 * - Mobile / tablet (< lg): content above, bottom tab bar pinned to screen edge.
 */
export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex flex-col h-dvh bg-canvas">
            <TopNav />
            <div className="flex flex-1 flex-col overflow-y-auto min-h-0">{children}</div>
            <BottomNav />
        </div>
    );
}
