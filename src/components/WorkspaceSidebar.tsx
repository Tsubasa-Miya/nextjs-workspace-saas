"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { IconHome, IconNote, IconUsers, IconFile } from './icons';

type WorkspaceNavItem = {
  href:
    | { pathname: '/workspaces/[id]'; params: { id: string } }
    | { pathname: '/workspaces/[id]/notes'; params: { id: string } }
    | { pathname: '/workspaces/[id]/members'; params: { id: string } }
    | { pathname: '/workspaces/[id]/assets'; params: { id: string } };
  path: string;
  label: string;
  Icon: typeof IconHome;
};

export function WorkspaceSidebar({ workspaceId, name }: { workspaceId: string; name?: string }) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  function isActive(path: string) {
    if (path === `/workspaces/${workspaceId}`) return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  const base = `/workspaces/${workspaceId}`;
  const items: WorkspaceNavItem[] = [
    { href: { pathname: '/workspaces/[id]', params: { id: workspaceId } }, path: base, label: 'Overview', Icon: IconHome },
    { href: { pathname: '/workspaces/[id]/notes', params: { id: workspaceId } }, path: `${base}/notes`, label: 'Notes', Icon: IconNote },
    { href: { pathname: '/workspaces/[id]/members', params: { id: workspaceId } }, path: `${base}/members`, label: 'Members', Icon: IconUsers },
    { href: { pathname: '/workspaces/[id]/assets', params: { id: workspaceId } }, path: `${base}/assets`, label: 'Assets', Icon: IconFile },
  ];
  return (
    <aside className="sidebar" aria-label="Workspace sidebar">
      <div className="title">{name || 'Workspace'}</div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 6 }}>General</div>
      <nav className="nav" style={{ marginBottom: 10 }}>
        {items.slice(0,1).map(({ href, path, label, Icon }) => (
          <Link key={path} href={href} className={isActive(path) ? 'active' : ''} aria-current={isActive(path) ? 'page' : undefined} title={label} onClick={() => { if (sidebar?.isOpen) sidebar.close(); }}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Workspace</div>
      <nav className="nav">
        {items.slice(1).map(({ href, path, label, Icon }) => (
          <Link key={path} href={href} className={isActive(path) ? 'active' : ''} aria-current={isActive(path) ? 'page' : undefined} title={label} onClick={() => { if (sidebar?.isOpen) sidebar.close(); }}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
