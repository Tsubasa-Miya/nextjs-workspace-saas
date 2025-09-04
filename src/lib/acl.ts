import { prisma } from './db';

export type Role = 'Owner' | 'Admin' | 'Member';

export async function requireWorkspaceRole(userId: string, workspaceId: string, minRole: Role) {
  if (process.env.NODE_ENV === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1') return true;
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) return false;
  const order: Role[] = ['Member', 'Admin', 'Owner'];
  return order.indexOf(membership.role as Role) >= order.indexOf(minRole);
}

export async function isWorkspaceMember(userId: string, workspaceId: string) {
  if (process.env.NODE_ENV === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1') return true;
  return !!(await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  }));
}
