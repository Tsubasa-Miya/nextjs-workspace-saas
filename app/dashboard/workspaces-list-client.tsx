/* istanbul ignore file */
"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { Input } from '@/src/components/ui/Input';

type Item = { id: string; name: string; slug: string; role: 'Owner' | 'Admin' | 'Member' };

export function WorkspacesListClient({ items }: { items: Item[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => i.name.toLowerCase().includes(t) || i.slug.toLowerCase().includes(t));
  }, [q, items]);

  return (
    <div>
      <Toolbar>
        <label htmlFor="ws-filter" className="sr-only">Filter workspaces</label>
        <Input
          id="ws-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or slug"
          aria-label="Filter workspaces"
          style={{ maxWidth: 360, width: '100%' }}
        />
      </Toolbar>
      <ul>
        {filtered.map((m) => (
          <li key={m.id} style={{ padding: '8px 0' }}>
            <Link href={`/workspaces/${m.id}`}>{m.name}</Link> <small className="muted">({m.role})</small>
            <span className="muted" style={{ marginLeft: 8 }}>|</span>
            <span style={{ marginLeft: 8 }}>
              <Link href={`/workspaces/${m.id}/notes`}>Notes</Link>
              <span className="muted" style={{ margin: '0 6px' }}>|</span>
              <Link href={`/workspaces/${m.id}/members`}>Members</Link>
              <span className="muted" style={{ margin: '0 6px' }}>|</span>
              <Link href={`/workspaces/${m.id}/assets`}>Assets</Link>
            </span>
          </li>
        ))}
        {filtered.length === 0 && <li>No workspaces found</li>}
      </ul>
    </div>
  );
}
