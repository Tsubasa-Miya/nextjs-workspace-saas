"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { IconHome, IconNote, IconUsers, IconFile } from './icons';

export function WorkspaceSidebar({ workspaceId, name }: { workspaceId: string; name?: string }) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  function isActive(href: string) {
    if (href === `/workspaces/${workspaceId}`) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }
  const base = `/workspaces/${workspaceId}`;
  const items = [
    { href: base, label: 'Overview', Icon: IconHome },
    { href: `${base}/notes`, label: 'Notes', Icon: IconNote },
    { href: `${base}/members`, label: 'Members', Icon: IconUsers },
    { href: `${base}/assets`, label: 'Assets', Icon: IconFile },
  ] as const;
  return (
    <aside className="sidebar" aria-label="Workspace sidebar">
      <div className="title">{name || 'Workspace'}</div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 6 }}>General</div>
      <nav className="nav" style={{ marginBottom: 10 }}>
        {items.slice(0,1).map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={isActive(href) ? 'active' : ''} aria-current={isActive(href) ? 'page' : undefined} title={label} onClick={() => { if (sidebar?.isOpen) sidebar.close(); }}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Workspace</div>
      <nav className="nav">
        {items.slice(1).map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={isActive(href) ? 'active' : ''} aria-current={isActive(href) ? 'page' : undefined} title={label} onClick={() => { if (sidebar?.isOpen) sidebar.close(); }}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
