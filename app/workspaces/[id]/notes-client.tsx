/* istanbul ignore file */
"use client";
import { useState } from 'react';
const PREVIEW_LIMIT: number = Number(process.env.NEXT_PUBLIC_NOTE_PREVIEW_LIMIT ?? '280') || 280;
import { Modal } from '@/src/components/Modal';
import type { NoteDTO } from '@/src/lib/types';

type Note = NoteDTO;

type ZodFlattenedError = {
  formErrors?: unknown;
  fieldErrors?: unknown;
};

function isStringArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every((v) => typeof v === 'string');
}

export function NotesClient({ workspaceId, initialNotes }: { workspaceId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');

  function shapeError(input: unknown, fallback = 'Failed to create note') {
    const base = input as { error?: unknown; message?: unknown } | null;
    const err = base && (base.error ?? base.message);
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as ZodFlattenedError;
      const formErrors = Array.isArray(e.formErrors) ? (e.formErrors as unknown[]) : [];
      const fieldErrorsArray: string[] = (() => {
        if (!e.fieldErrors || typeof e.fieldErrors !== 'object') return [];
        const values = Object.values(e.fieldErrors as Record<string, unknown>);
        const flat = values.flatMap((v) => (Array.isArray(v) ? v : []));
        return flat.filter((v): v is string => typeof v === 'string');
      })();
      const combined = [...formErrors.filter((v): v is string => typeof v === 'string'), ...fieldErrorsArray];
      if (combined.length) return combined.join(', ');
    }
    return fallback;
  }

  async function createNote(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, title, body, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) setError(shapeError(data));
      else {
        setNotes([data as Note, ...notes]);
        setTitle('');
        setBody('');
        setTags('');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) setNotes(notes.filter((n) => n.id !== id));
  }

  type NoteUpdatePayload = {
    title?: string;
    body?: string;
    tags?: string[];
  };

  async function saveNote(id: string, next: NoteUpdatePayload) {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, workspaceId, ...next }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Note;
      setNotes(notes.map((n) => (n.id === id ? updated : n)));
    }
  }

  function openEdit(n: Note) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditBody(n.body);
    setEditTags((n.tags || []).join(', '));
  }

  async function saveEdit() {
    if (!editingId) return;
    const next: NoteUpdatePayload = {
      title: editTitle,
      body: editBody,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    await saveNote(editingId, next);
    setEditingId(null);
  }

  const filteredNotes = notes.filter((n) => {
    const text = filterText.trim().toLowerCase();
    if (!text) return true;
    const inTitle = n.title.toLowerCase().includes(text);
    const inBody = (n.body || '').toLowerCase().includes(text);
    const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(text));
    return inTitle || inBody || inTags;
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function toggleExpanded(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }
  function previewText(text: string, id: string) {
    const isExpanded = !!expanded[id];
    if (isExpanded) return text;
    const limit = PREVIEW_LIMIT; // characters
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '…';
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Filter by title/body/tag"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ padding: 6, flex: 1 }}
          aria-label="Filter notes"
        />
      </div>
      <form onSubmit={createNote} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <input placeholder="Title" aria-label="Note title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: 8 }} />
        <textarea placeholder="Body" aria-label="Note body" value={body} onChange={(e) => setBody(e.target.value)} required style={{ padding: 8 }} />
        <input placeholder="Tags (comma-separated)" aria-label="Note tags" value={tags} onChange={(e) => setTags(e.target.value)} style={{ padding: 8 }} />
        <button type="submit" disabled={loading} style={{ padding: '6px 10px' }} aria-label="Add note">{loading ? 'Creating…' : 'Add Note'}</button>
        {error && <p role="alert" aria-live="assertive" style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <ul>
        {filteredNotes.map((n) => (
          <li key={n.id} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{n.title}</strong>
              <button onClick={() => openEdit(n)} style={{ padding: '4px 8px' }} aria-label={`Edit note ${n.title}`}>Edit</button>
            </div>
            {(n.createdAt || n.updatedAt || n.creatorLabel) && (
              <div style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {n.creatorLabel && <span>By: {n.creatorLabel}</span>}
                {n.createdAt && <span>Created: {new Date(n.createdAt).toLocaleString()}</span>}
                {n.updatedAt && <span>Updated: {new Date(n.updatedAt).toLocaleString()}</span>}
              </div>
            )}
            {(n.tags && n.tags.length > 0) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {n.tags.map((t) => (
                  <span key={t} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div style={{ margin: '6px 0' }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{previewText(n.body, n.id)}</p>
              {n.body && n.body.length > PREVIEW_LIMIT && (
                <button
                  onClick={() => toggleExpanded(n.id)}
                  aria-expanded={!!expanded[n.id]}
                  style={{ padding: '2px 6px', marginTop: 6 }}
                >
                  {expanded[n.id] ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            <div>
              <button onClick={() => deleteNote(n.id)} style={{ padding: '4px 8px', marginTop: 6 }} aria-label={`Delete note ${n.title}`}>Delete</button>
            </div>
          </li>
        ))}
        {notes.length === 0 && <li>No notes yet</li>}
      </ul>
      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Note" width={640}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Title
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            Body
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            Tags (comma-separated)
            <input value={editTags} onChange={(e) => setEditTags(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px' }} aria-label="Cancel editing note">Cancel</button>
            <button onClick={saveEdit} style={{ padding: '6px 10px' }} aria-label="Save note changes">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
