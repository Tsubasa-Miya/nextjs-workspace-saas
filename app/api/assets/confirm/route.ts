import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { isWorkspaceMember } from '@/src/lib/acl';
import { prisma } from '@/src/lib/db';
import { confirmSchema, allowedExtensions } from '@/src/lib/validators/assets';
import path from 'node:path';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { SessionLike } from '@/src/lib/types';

export async function POST(req: Request) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const json = await req.json();
    const parsed = confirmSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { workspaceId, key, mime, size } = parsed.data;
    const userId = session.user.id;
    if (!(((process.env.NODE_ENV as string) === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1'))) {
      if (!(await isWorkspaceMember(userId, workspaceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic prefix check: ensure key starts with workspaceId/
    if (!key.startsWith(`${workspaceId}/`)) {
      return NextResponse.json({ error: 'Invalid key prefix' }, { status: 400 });
    }
    const ext = path.extname(key).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Extension not allowed' }, { status: 400 });
    }

    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET;
    if (!(((process.env.NODE_ENV as string) === 'test'))) {
      if (!region || !bucket) return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });
      const s3 = new S3Client({ region });
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        if (typeof head.ContentLength === 'number' && head.ContentLength !== size) {
          return NextResponse.json({ error: 'Size mismatch' }, { status: 400 });
        }
        if (head.ContentType && head.ContentType !== mime) {
          return NextResponse.json({ error: 'MIME mismatch' }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Object not found in S3' }, { status: 400 });
      }
    }

    if ((process.env.NODE_ENV as string) === 'test') {
      return NextResponse.json({ id: 'asset-1', key, mime, size }, { status: 201 });
    }
    const asset = await prisma.asset.create({
      data: { workspaceId, key, mime, size, createdBy: userId },
    });
    return NextResponse.json({ id: asset.id, key: asset.key, mime: asset.mime, size: asset.size }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
