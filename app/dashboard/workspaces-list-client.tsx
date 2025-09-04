/* istanbul ignore file */
"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';

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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or slug"
          aria-label="Filter workspaces"
          style={{ padding: 8, maxWidth: 360, width: '100%' }}
        />
      </div>
      <ul>
        {filtered.map((m) => (
          <li key={m.id}>
            <Link href={`/workspaces/${m.id}`}>{m.name}</Link> <small>({m.role})</small>
            <span style={{ marginLeft: 8, color: '#999' }}>|</span>
            <span style={{ marginLeft: 8 }}>
              <Link href={`/workspaces/${m.id}/notes`}>Notes</Link>
              <span style={{ margin: '0 6px' }}>|</span>
              <Link href={`/workspaces/${m.id}/members`}>Members</Link>
              <span style={{ margin: '0 6px' }}>|</span>
              <Link href={`/workspaces/${m.id}/assets`}>Assets</Link>
            </span>
          </li>
        ))}
        {filtered.length === 0 && <li>No workspaces found</li>}
      </ul>
    </div>
  );
}

