/* istanbul ignore file */
"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
}

export function WorkspaceCreateForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function onNameChange(v: string) {
    setName(v);
    if (!slug) {
      setSlug(slugify(v));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slug || slugify(name) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed to create workspace');
      } else {
        router.push(`/workspaces/${data.id}`);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" value={name} onChange={(e) => onNameChange(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </div>
      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required style={{ width: '100%', padding: 8 }} />
        <small>URL-safe unique identifier</small>
      </div>
      <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Creating…' : 'Create'}</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  );
}
