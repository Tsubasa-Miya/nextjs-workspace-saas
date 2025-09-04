import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { signSchema, allowedExtensions } from '@/src/lib/validators/assets';
import { isWorkspaceMember } from '@/src/lib/acl';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { SessionLike } from '@/src/lib/types';

export async function POST(req: Request) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const json = await req.json();
    const parsed = signSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { workspaceId, filename, contentType } = parsed.data;
    const userId = session.user.id;
    if (!(((process.env.NODE_ENV as string) === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1'))) {
      if (!(await isWorkspaceMember(userId, workspaceId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'Extension not allowed' }, { status: 400 });
    }
    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET;
    if (!region || !bucket) {
      return NextResponse.json({ error: 'S3 not configured' }, { status: 500 });
    }
    const key = `${workspaceId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${randomUUID()}-${filename}`;
    let uploadUrl: string;
    if ((process.env.NODE_ENV as string) === 'test') {
      uploadUrl = 'https://example.test/upload';
    } else {
      const s3 = new S3Client({ region });
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    }
    return NextResponse.json({ uploadUrl, key, contentType });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
