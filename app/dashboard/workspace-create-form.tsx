/* istanbul ignore file */
"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { FieldError } from '@/src/components/ui/FieldError';
import { HelpText } from '@/src/components/ui/HelpText';
import { FormField } from '@/src/components/ui/FormField';
import { extractFieldErrors, firstFieldError, shapeMessage } from '@/src/lib/fieldErrors';
import { postJson } from '@/src/lib/api';
import { workspacesCreate } from '@/src/lib/apiPresets';

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
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [slugErr, setSlugErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

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
    setNameErr(null); setSlugErr(null);
    try {
      const result = await workspacesCreate({ name, slug: slug || slugify(name) });
      if (!result.ok) {
        const fe = extractFieldErrors(result.data);
        setNameErr(firstFieldError(fe, 'name'));
        setSlugErr(firstFieldError(fe, 'slug'));
        const msg = result.error.message || 'Failed to create workspace';
        setError(msg);
        toast.add(msg, 'danger');
      } else {
        toast.add('Workspace created');
        router.push(`/workspaces/${(result.data as any).id}`);
      }
    } catch (err) {
      setError('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ maxWidth: 420 }}>
      <FormField id="name" label="Name" required error={nameErr || undefined}>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
      </FormField>
      <FormField id="slug" label="Slug" help="URL-safe unique identifier" required error={slugErr || undefined}>
        <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
      </FormField>
      <Button variant="primary" type="submit" loading={loading}>Create</Button>
      <FieldError id="ws-name-error">{error}</FieldError>
    </form>
  );
}
