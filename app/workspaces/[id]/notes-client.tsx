/* istanbul ignore file */
"use client";
import { useState } from 'react';
const PREVIEW_LIMIT: number = Number(process.env.NEXT_PUBLIC_NOTE_PREVIEW_LIMIT ?? '280') || 280;
import { Modal } from '@/src/components/Modal';
import type { NoteDTO } from '@/src/lib/types';
import { useToast } from '@/src/components/toast/ToastProvider';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { extractFieldErrors, firstFieldError, shapeMessage } from '@/src/lib/fieldErrors';
import { notesCreate, notesPatch, notesDelete } from '@/src/lib/apiPresets';
import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';
import { Button } from '@/src/components/ui/Button';
import { FieldError } from '@/src/components/ui/FieldError';
import { FormField } from '@/src/components/ui/FormField';
import { Toolbar } from '@/src/components/ui/Toolbar';

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
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; body?: string; tags?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editErrors, setEditErrors] = useState<{ title?: string; body?: string } | null>(null);
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);

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
    // client validation
    const errs: { title?: string; body?: string } = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!body.trim()) errs.body = 'Body is required';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setLoading(false);
      return;
    }
    setFieldErrors(null);
    try {
      const result = await notesCreate({ workspaceId, title, body, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) });
      if (!result.ok) {
        const fe = result.error.fieldErrors;
        setFieldErrors({
          title: firstFieldError(fe || null, 'title') || undefined,
          body: firstFieldError(fe || null, 'body') || undefined,
          tags: firstFieldError(fe || null, 'tags') || undefined,
        });
        setError(result.error.message);
        toast.add(result.error.message, 'danger');
      }
      else {
        setNotes([result.data as Note, ...notes]);
        setTitle('');
        setBody('');
        setTags('');
        toast.add('Note created');
      }
    } catch (err) {
      setError('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: string) {
    const result = await notesDelete(id);
    if (result.ok) {
      setNotes(notes.filter((n) => n.id !== id));
      toast.add('Note deleted');
    } else {
      const msg = (result as any).error?.message || 'Failed to delete note';
      toast.add(msg, 'danger');
    }
  }

  type NoteUpdatePayload = {
    title?: string;
    body?: string;
    tags?: string[];
  };

  async function saveNote(id: string, next: NoteUpdatePayload): Promise<{ ok: boolean; data?: unknown }> {
    const result = await patchJson<Note>('/api/notes', { id, workspaceId, ...next });
    if (result.ok) {
      const updated = result.data as Note;
      setNotes(notes.map((n) => (n.id === id ? updated : n)));
      // 編集保存のみで使用するのでここでトースト
      toast.add('Note updated');
      return { ok: true, data: result.data };
    } else {
      const msg = result.error.message;
      toast.add(msg, 'danger');
      return { ok: false, data: result.error.fieldErrors };
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
    const errs: { title?: string; body?: string } = {};
    if (!editTitle.trim()) errs.title = 'Title is required';
    if (!editBody.trim()) errs.body = 'Body is required';
    if (Object.keys(errs).length) {
      setEditErrors(errs);
      return;
    }
    setEditErrors(null);
    const next: NoteUpdatePayload = {
      title: editTitle,
      body: editBody,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const result = await saveNote(editingId, next);
    if (!result.ok) {
      const fe = extractFieldErrors(result.data);
      setEditErrors({
        title: firstFieldError(fe, 'title') || undefined,
        body: firstFieldError(fe, 'body') || undefined,
      });
      return;
    }
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
      <Toolbar>
        <label htmlFor="notes-filter" className="sr-only">Filter notes</label>
        <Input
          id="notes-filter"
          placeholder="Filter by title/body/tag"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
          aria-label="Filter notes"
        />
      </Toolbar>
      <form onSubmit={createNote} className="stack" style={{ marginBottom: 16 }}>
        <FormField id="note-title" label="Title" required error={fieldErrors?.title}>
          <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="note-body" label="Body" required error={fieldErrors?.body}>
          <Textarea placeholder="Note body" value={body} onChange={(e) => setBody(e.target.value)} />
        </FormField>
        <FormField id="note-tags" label="Tags" help="Comma-separated" error={fieldErrors?.tags}>
          <Input placeholder="tag1, tag2" value={tags} onChange={(e) => setTags(e.target.value)} />
        </FormField>
        <Button variant="primary" type="submit" loading={loading} aria-label="Add note">Add Note</Button>
        <FieldError>{error}</FieldError>
      </form>
      <ul>
        {filteredNotes.map((n) => (
          <li key={n.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{n.title}</strong>
              <button className="btn" onClick={() => openEdit(n)} aria-label={`Edit note ${n.title}`}>Edit</button>
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
                  <span key={t} className="badge" style={{ background: '#e5e7eb', color: '#111' }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ margin: '6px 0' }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{previewText(n.body, n.id)}</p>
              {n.body && n.body.length > PREVIEW_LIMIT && (
                <Button variant="ghost" size="sm"
                  onClick={() => toggleExpanded(n.id)}
                  aria-expanded={!!expanded[n.id]}
                  style={{ marginTop: 6 }}
                >
                  {expanded[n.id] ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
            <div>
              <Button size="sm" variant="danger" onClick={() => setConfirming(n.id)} style={{ marginTop: 6 }} aria-label={`Delete note ${n.title}`}>Delete</Button>
            </div>
          </li>
        ))}
        {notes.length === 0 && <li>No notes yet</li>}
      </ul>
      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Note" width={640}>
        <div style={{ display: 'grid', gap: 8 }}>
          <FormField id="edit-note-title" label="Title" required error={editErrors?.title}>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </FormField>
          <FormField id="edit-note-body" label="Body" error={editErrors?.body}>
            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
          </FormField>
          <FormField id="edit-note-tags" label="Tags (comma-separated)">
            <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => setEditingId(null)} aria-label="Cancel editing note">Cancel</Button>
            <Button variant="primary" onClick={saveEdit} aria-label="Save note changes">Save</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirming}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        cancelText="Cancel"
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          const id = confirming;
          setConfirming(null);
          await deleteNote(id);
        }}
      />
    </div>
  );
}
