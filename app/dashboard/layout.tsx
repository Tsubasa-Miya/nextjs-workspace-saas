import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/src/components/DashboardSidebar';
import { SidebarFrame } from '@/src/components/SidebarFrame';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarFrame sidebar={<DashboardSidebar />}>{children}</SidebarFrame>
  );
}
