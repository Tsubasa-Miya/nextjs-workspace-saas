/* istanbul ignore file */
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Modal';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { Button } from '@/src/components/ui/Button';
import { FieldError } from '@/src/components/ui/FieldError';
import { FormField } from '@/src/components/ui/FormField';
import { extractFieldErrors, firstFieldError } from '@/src/lib/fieldErrors';
import { tasksCreate, tasksPatch, tasksDelete } from '@/src/lib/apiPresets';
import { HelpText } from '@/src/components/ui/HelpText';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { useToast } from '@/src/components/toast/ToastProvider';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'Todo' | 'InProgress' | 'Done';
  createdAt: string;
  assigneeId: string | null;
  dueAt: string | null;
};

export function TasksClient({ workspaceId, initialTasks, members, currentUserId }: { workspaceId: string; initialTasks: Task[]; members: { id: string; label: string }[]; currentUserId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<{ title?: string; dueAt?: string } | null>(null);

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
  const [editErrors, setEditErrors] = useState<{ title?: string; dueAt?: string } | null>(null);

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
    // client-side minimal validation
    const cErrs: { title?: string; dueAt?: string } = {};
    if (!title.trim()) cErrs.title = 'Title is required';
    if (Object.keys(cErrs).length) {
      setCreateErrors(cErrs);
      setLoading(false);
      return;
    }
    setCreateErrors(null);
    try {
      const isoDueAt = dueAt ? localInputToIso(dueAt) : null;
      const result = await tasksCreate({ workspaceId, title, description, dueAt: isoDueAt ?? undefined });
      if (!result.ok) {
        const fe = result.error.fieldErrors;
        setCreateErrors({
          title: firstFieldError(fe || null, 'title') || undefined,
          dueAt: firstFieldError(fe || null, 'dueAt') || undefined,
        });
        setError(result.error.message);
        toast.add(result.error.message, 'danger');
      } else {
        const nextTask: Task = {
          id: result.data.id,
          title: result.data.title ?? title,
          description: result.data.description ?? (description || null),
          status: result.data.status,
          createdAt: result.data.createdAt ?? new Date().toISOString(),
          assigneeId: result.data.assigneeId ?? null,
          dueAt: result.data.dueAt ?? null,
        };
        setTasks((prev) => [nextTask, ...prev]);
        setTitle('');
        setDescription('');
        setDueAt('');
        toast.add('Task created');
      }
    } catch (err) {
      setError('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id: string) {
    const result = await tasksDelete(id);
    if (result.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.add('Task deleted');
    } else {
      const msg = result.error.message || 'Failed to delete task';
      toast.add(msg, 'danger');
    }
  }

  async function refresh() {
    router.refresh();
  }

  async function updateTask(id: string, next: Partial<Task> & { assigneeId?: string | null }): Promise<{ ok: boolean; data?: unknown }> {
    const result = await tasksPatch({ id, workspaceId, ...next });
    if (result.ok) {
      const updated = result.data;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      return { ok: true, data: result.data };
    } else {
      const msg = result.error.message;
      toast.add(msg, 'danger');
      return { ok: false, data: result.error.fieldErrors };
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
    const errs: { title?: string } = {};
    if (!editTitle.trim()) errs.title = 'Title is required';
    if (Object.keys(errs).length) {
      setEditErrors(errs);
      return;
    }
    setEditErrors(null);
    const payload: TaskUpdatePayload = {
      title: editTitle,
      description: editDescription,
      status: editStatus,
      assigneeId: editAssigneeId || null,
      dueAt: editDueAt ? localInputToIso(editDueAt) : null,
    };
    const result = await updateTask(editingId, payload);
    if (!result.ok) {
      const fe = extractFieldErrors(result.data);
      setEditErrors({
        title: firstFieldError(fe, 'title') || undefined,
        dueAt: firstFieldError(fe, 'dueAt') || undefined,
      });
      return;
    }
    setEditingId(null);
    toast.add('Task updated');
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
      <Toolbar>
        <label htmlFor="tasks-filter" className="sr-only">Filter tasks</label>
        <Input
          id="tasks-filter"
          placeholder="Filter by title/description"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
          aria-label="Filter tasks"
        />
        <label className="row" style={{ marginLeft: 'auto' }}>
          <span className="muted">Status</span>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Todo' | 'InProgress' | 'Done')} aria-label="Filter by status">
            <option value="All">All</option>
            <option value="Todo">Todo</option>
            <option value="InProgress">InProgress</option>
            <option value="Done">Done</option>
          </Select>
        </label>
        <label className="row">
          <span className="muted">Sort</span>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'CreatedDesc' | 'DueAsc' | 'Status' | 'TitleAsc')} aria-label="Sort tasks">
            <option value="CreatedDesc">Newest</option>
            <option value="DueAsc">Due date</option>
            <option value="Status">Status</option>
            <option value="TitleAsc">Title</option>
          </Select>
        </label>
      </Toolbar>
      <form onSubmit={createTask} className="stack" style={{ marginBottom: 16, maxWidth: 520 }}>
        <FormField id="task-title" label="Title" required error={createErrors?.title}>
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="task-desc" label="Description">
          <Textarea placeholder="Task description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField id="task-due" label="Due" help="Local time" error={createErrors?.dueAt}>
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </FormField>
        <div className="row">
        <Button variant="primary" type="submit" loading={loading} aria-label="Add task">Add Task</Button>
          <Button type="button" onClick={refresh} aria-label="Refresh tasks">Refresh</Button>
        </div>
        <FieldError>{error}</FieldError>
      </form>
      <ul>
        {displayedTasks.map((t) => {
          const overdue = isOverdue(t);
          const dueSoon = !overdue && isDueSoon(t);
          return (
            <li key={t.id} className="card" style={{ padding: 12, marginBottom: 8, borderColor: overdue ? 'var(--danger)' : dueSoon ? 'var(--warn)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{t.title}</strong>
                  {overdue && (
                    <span aria-label="Overdue" title="Overdue" className="badge danger">Overdue</span>
                  )}
                  {dueSoon && (
                    <span aria-label="Due soon" title="Due soon" className="badge warn">Due soon</span>
                  )}
                </div>
                <Button size="sm" onClick={() => openEdit(t)} aria-label={`Edit task ${t.title}`}>Edit</Button>
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
                <Select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as 'Todo' | 'InProgress' | 'Done' })}>
                  <option value="Todo">Todo</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Done">Done</option>
                </Select>
              </label>
              <label>
                Assignee:{' '}
                <Select
                  value={t.assigneeId || ''}
                  onChange={(e) => updateTask(t.id, { assigneeId: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </label>
              <Button size="sm" onClick={() => updateTask(t.id, { assigneeId: currentUserId })} aria-label={`Assign task ${t.title} to me`}>Assign to me</Button>
            </div>
            <div>
              <Button size="sm" variant="danger" onClick={() => setConfirming(t.id)} style={{ marginTop: 6 }} aria-label={`Delete task ${t.title}`}>Delete</Button>
            </div>
          </li>
          );
        })}
        {tasks.length === 0 && <li>No tasks yet</li>}
      </ul>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Task" width={640}>
        <div style={{ display: 'grid', gap: 8 }}>
        <FormField id="edit-task-title" label="Title" required error={editErrors?.title}>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </FormField>
          <FormField id="edit-task-desc" label="Description">
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 12 }}>
            <FormField id="edit-task-status" label="Status">
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'Todo' | 'InProgress' | 'Done')}>
                <option value="Todo">Todo</option>
                <option value="InProgress">InProgress</option>
                <option value="Done">Done</option>
              </Select>
            </FormField>
            <FormField id="edit-task-assignee" label="Assignee">
              <Select value={editAssigneeId} onChange={(e) => setEditAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField id="edit-task-due" label="Due" help="Local time" error={editErrors?.dueAt}>
            <Input type="datetime-local" value={editDueAt} onChange={(e) => setEditDueAt(e.target.value)} style={{ maxWidth: 240 }} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => setEditingId(null)} aria-label="Cancel editing task">Cancel</Button>
            <Button variant="primary" onClick={saveEdit} aria-label="Save task changes">Save</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirming}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        cancelText="Cancel"
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          const id = confirming;
          setConfirming(null);
          await deleteTask(id);
        }}
      />
    </div>
  );
}
