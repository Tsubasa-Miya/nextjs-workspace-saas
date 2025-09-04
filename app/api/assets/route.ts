import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember } from '@/src/lib/acl';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { SessionLike } from '@/src/lib/types';

export async function GET(req: Request) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  const userId = session.user.id;
  if (!(((process.env.NODE_ENV as string) === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1'))) {
    if (!(await isWorkspaceMember(userId, workspaceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const assets = await prisma.asset.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  const payload = (process.env.NODE_ENV as string) === 'test' ? JSON.parse(JSON.stringify(assets)) : assets;
  return NextResponse.json(payload);
}

export async function DELETE(req: Request) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const userId = session.user.id;
  if (!(((process.env.NODE_ENV as string) === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1'))) {
    if (!(await isWorkspaceMember(userId, asset.workspaceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // attempt S3 delete (best-effort)
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;
  if (region && bucket) {
    try {
      const s3 = new S3Client({ region });
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: asset.key }));
    } catch (e) {
      console.warn('S3 delete failed', e);
    }
  }
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
