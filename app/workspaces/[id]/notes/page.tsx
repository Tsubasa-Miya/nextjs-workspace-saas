/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember } from '@/src/lib/acl';
import { redirect } from 'next/navigation';
import { NotesClient } from '../notes-client';
import type { NoteDTO, SessionLike } from '@/src/lib/types';
import { Card } from '@/src/components/ui/Card';

type Params = { params: { id: string } };

function parseTags(input: unknown): string[] | null {
  if (!input) return null;
  if (Array.isArray(input) && input.every((t) => typeof t === 'string')) {
    return input as string[];
  }
  return null;
}

export default async function NotesPage({ params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(await isWorkspaceMember(userId, workspaceId))) redirect('/dashboard');
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) redirect('/dashboard');
  const notesRaw = await prisma.note.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      body: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });
  const notes: NoteDTO[] = notesRaw.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    tags: parseTags(n.tags),
    createdAt: (n.createdAt as Date).toISOString(),
    updatedAt: (n.updatedAt as Date).toISOString(),
    creatorLabel: n.creator.name || n.creator.email || n.creator.id,
  }));
  return (
    <div className="stack">
      <h1>{ws.name} — Notes</h1>
      <Card>
        <NotesClient workspaceId={workspaceId} initialNotes={notes} />
      </Card>
    </div>
  );
}
