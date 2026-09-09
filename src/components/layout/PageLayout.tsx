import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface PageLayoutProps {
  children: ReactNode;
  role: 'staff' | 'manager';
}

export default function PageLayout({ children, role }: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
