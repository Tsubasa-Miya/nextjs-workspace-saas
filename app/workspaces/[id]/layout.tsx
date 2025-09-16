import { prisma } from '@/src/lib/db';
import type { ReactNode } from 'react';
import { WorkspaceSidebar } from '@/src/components/WorkspaceSidebar';
import { SidebarFrame } from '@/src/components/SidebarFrame';

export default async function WorkspaceLayout({ children, params }: { children: ReactNode; params: { id: string } }) {
  const ws = await prisma.workspace.findUnique({ where: { id: params.id }, select: { name: true } });
  return (
    <SidebarFrame sidebar={<WorkspaceSidebar workspaceId={params.id} name={ws?.name || undefined} />}> 
      {children}
    </SidebarFrame>
  );
}
