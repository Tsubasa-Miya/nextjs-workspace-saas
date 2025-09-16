"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { IconHome } from './icons';

export function DashboardSidebar() {
  const pathname = usePathname();
  const sidebar = useSidebar();
  return (
    <aside className="sidebar" aria-label="Dashboard sidebar">
      <div className="title">Dashboard</div>
      <nav className="nav">
        <Link
          href="/dashboard"
          className={pathname === '/dashboard' ? 'active' : ''}
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
          title="Dashboard overview"
          onClick={() => { if (sidebar?.isOpen) sidebar.close(); }}
        >
          <IconHome />
          <span>Overview</span>
        </Link>
      </nav>
    </aside>
  );
}
