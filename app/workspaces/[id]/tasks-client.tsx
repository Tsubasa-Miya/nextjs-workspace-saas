/* istanbul ignore file */
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Modal';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'Todo' | 'InProgress' | 'Done';
  createdAt: string;
  assigneeId?: string | null;
  dueAt?: string | null;
};

export function TasksClient({ workspaceId, initialTasks, members, currentUserId }: { workspaceId: string; initialTasks: Task[]; members: { id: string; label: string }[]; currentUserId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Filters
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Todo' | 'InProgress' | 'Done'>('All');
  const [sortBy, setSortBy] = useState<'CreatedDesc' | 'DueAsc' | 'Status' | 'TitleAsc'>('CreatedDesc');

  function shapeError(input: unknown, fallback = 'Failed to create task') {
    const base = input as { error?: unknown; message?: unknown } | null;
    const err = base && (base.error ?? base.message);
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const formErrors = Array.isArray((err as { formErrors?: unknown }).formErrors)
        ? ((err as { formErrors?: unknown[] }).formErrors as unknown[])
        : [];
      const fieldErrorsObj = (err as { fieldErrors?: unknown }).fieldErrors;
      const fieldErrors = fieldErrorsObj && typeof fieldErrorsObj === 'object'
        ? Object.values(fieldErrorsObj as Record<string, unknown>).flatMap((v) => (Array.isArray(v) ? v : []))
        : [];
      const combined = [...formErrors, ...fieldErrors].filter((v): v is string => typeof v === 'string');
      if (combined.length) return combined.join(', ');
    }
    return fallback;
  }

  // Modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'Todo' | 'InProgress' | 'Done'>('Todo');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editDueAt, setEditDueAt] = useState(''); // datetime-local string

  function isoToLocalInput(value?: string | null) {
    if (!value) return '';
    const d = new Date(value);
    const tzOff = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - tzOff).toISOString().slice(0, 16);
    return local;
  }

  function localInputToIso(value: string) {
    if (!value) return null;
    // value is YYYY-MM-DDTHH:mm in local time; convert to ISO
    const dt = new Date(value);
    return dt.toISOString();
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, title, description, dueAt: dueAt ? localInputToIso(dueAt) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(shapeError(data));
      } else {
        setTasks([data, ...tasks]);
        setTitle('');
        setDescription('');
        setDueAt('');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  }

  async function refresh() {
    router.refresh();
  }

  async function updateTask(id: string, next: Partial<Task> & { assigneeId?: string | null }) {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, workspaceId, ...next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) => (t.id === id ? updated : t)));
    }
  }

  function openEdit(t: Task) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description ?? '');
    setEditStatus(t.status);
    setEditAssigneeId(t.assigneeId ?? '');
    setEditDueAt(isoToLocalInput(t.dueAt));
  }

  type TaskUpdatePayload = {
    title?: string;
    description?: string | null;
    status?: 'Todo' | 'InProgress' | 'Done';
    assigneeId?: string | null;
    dueAt?: string | null;
  };

  async function saveEdit() {
    if (!editingId) return;
    const payload: TaskUpdatePayload = {
      title: editTitle,
      description: editDescription,
      status: editStatus,
      assigneeId: editAssigneeId || null,
      dueAt: editDueAt ? localInputToIso(editDueAt) : null,
    };
    await updateTask(editingId, payload);
    setEditingId(null);
  }

  const filteredTasks = tasks.filter((t) => {
    const text = filterText.trim().toLowerCase();
    const matchText = !text ||
      t.title.toLowerCase().includes(text) ||
      (t.description || '').toLowerCase().includes(text);
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchText && matchStatus;
  });

  function compare(a: Task, b: Task) {
    switch (sortBy) {
      case 'DueAsc': {
        const da = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const db = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      }
      case 'Status': {
        const order = { Todo: 0, InProgress: 1, Done: 2 } as const;
        return order[a.status] - order[b.status];
      }
      case 'TitleAsc':
        return a.title.localeCompare(b.title);
      case 'CreatedDesc':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }

  const displayedTasks = [...filteredTasks].sort(compare);

  function isOverdue(t: Task) {
    if (!t.dueAt) return false;
    if (t.status === 'Done') return false;
    return new Date(t.dueAt).getTime() < Date.now();
  }

  function isDueSoon(t: Task) {
    if (!t.dueAt) return false;
    if (t.status === 'Done') return false;
    const now = Date.now();
    const due = new Date(t.dueAt).getTime();
    const soonWindow = 48 * 60 * 60 * 1000; // 48h
    return due >= now && due <= now + soonWindow;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Filter by title/description"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ padding: 6, flex: 1 }}
          aria-label="Filter tasks"
        />
        <label>
          Status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Todo' | 'InProgress' | 'Done')} style={{ marginLeft: 6, padding: 6 }} aria-label="Filter by status">
            <option value="All">All</option>
            <option value="Todo">Todo</option>
            <option value="InProgress">InProgress</option>
            <option value="Done">Done</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'CreatedDesc' | 'DueAsc' | 'Status' | 'TitleAsc')} style={{ marginLeft: 6, padding: 6 }} aria-label="Sort tasks">
            <option value="CreatedDesc">Newest</option>
            <option value="DueAsc">Due date</option>
            <option value="Status">Status</option>
            <option value="TitleAsc">Title</option>
          </select>
        </label>
      </div>
      <form onSubmit={createTask} style={{ display: 'grid', gap: 8, marginBottom: 16, maxWidth: 520 }}>
        <input placeholder="Title" aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: 8 }} />
        <textarea placeholder="Description" aria-label="Task description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: 8 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label>
            Due:
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              style={{ padding: 6, marginLeft: 6 }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: '6px 10px' }} aria-label="Add task">
            {loading ? 'Creating…' : 'Add Task'}
          </button>
          <button type="button" onClick={refresh} style={{ padding: '6px 10px' }} aria-label="Refresh tasks">Refresh</button>
        </div>
        {error && <p role="alert" aria-live="assertive" style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <ul>
        {displayedTasks.map((t) => {
          const overdue = isOverdue(t);
          const dueSoon = !overdue && isDueSoon(t);
          return (
            <li key={t.id} style={{ border: `1px solid ${overdue ? '#fca5a5' : dueSoon ? '#fcd34d' : '#eee'}`, padding: 8, marginBottom: 8, background: overdue ? '#fff1f2' : dueSoon ? '#fffbeb' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{t.title}</strong>
                  {overdue && (
                    <span aria-label="Overdue" title="Overdue" style={{ background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                      Overdue
                    </span>
                  )}
                  {dueSoon && (
                    <span aria-label="Due soon" title="Due soon" style={{ background: '#f59e0b', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                      Due soon
                    </span>
                  )}
                </div>
                <button onClick={() => openEdit(t)} style={{ padding: '4px 8px' }} aria-label={`Edit task ${t.title}`}>Edit</button>
              </div>
            <div style={{ display: 'flex', gap: 12, color: '#666', fontSize: 12, marginTop: 4 }}>
              <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
              {t.assigneeId && (
                <span>
                  Assignee: {members.find((m) => m.id === t.assigneeId)?.label || 'Unknown'}
                </span>
              )}
            </div>
            {t.description && <p style={{ margin: '4px 0' }}>{t.description}</p>}
            {t.dueAt && (
              <div style={{ margin: '4px 0' }}>
                <small>Due: {new Date(t.dueAt).toLocaleString()}</small>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label>
                Status:{' '}
                <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as 'Todo' | 'InProgress' | 'Done' })}>
                  <option value="Todo">Todo</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Done">Done</option>
                </select>
              </label>
              <label>
                Assignee:{' '}
                <select
                  value={t.assigneeId || ''}
                  onChange={(e) => updateTask(t.id, { assigneeId: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => updateTask(t.id, { assigneeId: currentUserId })} style={{ padding: '4px 8px' }} aria-label={`Assign task ${t.title} to me`}>Assign to me</button>
            </div>
            <div>
              <button onClick={() => deleteTask(t.id)} style={{ padding: '4px 8px', marginTop: 6 }} aria-label={`Delete task ${t.title}`}>Delete</button>
            </div>
          </li>
          );
        })}
        {tasks.length === 0 && <li>No tasks yet</li>}
      </ul>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Task" width={640}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Title
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            Description
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label>
              Status
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'Todo' | 'InProgress' | 'Done')} style={{ marginLeft: 6 }}>
                <option value="Todo">Todo</option>
                <option value="InProgress">InProgress</option>
                <option value="Done">Done</option>
              </select>
            </label>
            <label>
              Assignee
              <select value={editAssigneeId} onChange={(e) => setEditAssigneeId(e.target.value)} style={{ marginLeft: 6 }}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Due
            <input type="datetime-local" value={editDueAt} onChange={(e) => setEditDueAt(e.target.value)} style={{ marginLeft: 6, padding: 6 }} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px' }} aria-label="Cancel editing task">Cancel</button>
            <button onClick={saveEdit} style={{ padding: '6px 10px' }} aria-label="Save task changes">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
