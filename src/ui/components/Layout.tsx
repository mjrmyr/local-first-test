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
            <div className="flex-1 overflow-y-auto">{children}</div>
            <BottomNav />
        </div>
    );
}
