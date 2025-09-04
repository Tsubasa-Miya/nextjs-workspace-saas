SaaS Starter (Next.js + PostgreSQL)

Overview
- Next.js App Router + NextAuth (Credentials)
- PostgreSQL via Prisma
- Zod validation at API boundaries
- Workspace-scoped data model (multi-tenant ready)

Getting Started
1) Copy .env.example to .env and set DATABASE_URL and NEXTAUTH_SECRET.
2) Install deps: npm i (or pnpm i / yarn)
3) Generate Prisma client: npm run prisma:generate
4) Run dev server: npm run dev

Testing & Coverage
- Run all tests: `npm run test`
- Watch mode: `npm run test:watch`
- Library-only tests: `npm run test:lib`
- Coverage HTML report: `npm run test -- --coverage` → open `coverage/index.html`
- Coverage targets (staged): set env `COV` to enforce thresholds (statements/lines/functions = COV, branches = COV-10)
  - Examples:
    - `COV=70 npm run test -- --coverage`  (initial target)
    - `COV=80 npm run test -- --coverage`  (next stage)
    - `COV=90 npm run test -- --coverage`  (final target)

Notes for Tests
- UI pages (`app/**/*.tsx`) and config files are excluded from coverage to focus on API and libraries.
- In tests that need unauthenticated state, set `process.env.AUTH_FORCE_NULL = '1'` before importing routes.

Notes
- Production secrets must come from SSM/Secrets Manager, not .env.
- Prestart runs prisma migrate deploy; call before starting on EC2.

S3 Upload Flow
- Sign URL: POST `/api/assets/sign` with `{ workspaceId, filename, contentType, size }` → returns `{ uploadUrl, key }`
- Client uploads via PUT to `uploadUrl` with `Content-Type` matching exactly
- Confirm: POST `/api/assets/confirm` with `{ workspaceId, key, mime, size }` → persists `Asset`

S3 CORS (required for browser PUT)
Example bucket CORS configuration:
```
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "HEAD", "GET"],
    "AllowedOrigins": ["https://your.app.domain", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

AWS Setup (Reference)
- S3 Bucket policy/IAM (scoped prefix). Example IAM inline policy for app role:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3WriteOnlyToPrefix",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    },
    {
      "Sid": "S3HeadGetForVerify",
      "Effect": "Allow",
      "Action": ["s3:HeadObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    }
  ]
}
```
- Optionally restrict by prefix via application logic (we enforce `${workspaceId}/` key prefix) and/or IAM conditions such as `s3:prefix` in presigned POST policies.

SES Setup (Reference)
- Verify domain and set MAIL_FROM (e.g., no-reply@yourdomain)
- In sandbox, verify recipient emails or leave sandbox
- Environment variables: `AWS_REGION`, `MAIL_FROM`, `APP_BASE_URL` (or `NEXTAUTH_URL`)

CI/CD (GitHub Actions → EC2)
- Secrets to set in the repo:
  - `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (private key), `EC2_SSH_PORT` (optional), `EC2_PATH` (e.g., `/var/www/saas`)
- Server preparation:
  - Install Node LTS and pm2
  - Create deploy path and permissions: `sudo mkdir -p /var/www/saas && sudo chown $USER /var/www/saas`
  - Ensure environment variables are provided via systemd/pm2 env or SSM injection
- Flow:
  - Build in CI using `output: 'standalone'`
  - Upload `app.tar.gz` to EC2, extract into `releases/<timestamp>`, flip `current` symlink
  - `pm2 startOrReload ecosystem.config.js` to start/reload the app

One-command Deploy (Local → EC2 via SSH)
- Script: `scripts/deploy.sh` performs build → package → upload → release → pm2 reload
- Prereqs (on EC2): Node LTS, pm2 installed (`npm i -g pm2`), deploy path prepared, and `.env` stored at `<EC2_PATH>/shared/.env`.
- Env vars (on your machine):
  - `EC2_HOST` (e.g., `ec2-1-2-3-4.compute.amazonaws.com`)
  - `EC2_USER` (e.g., `ubuntu`)
  - `EC2_PATH` (e.g., `/var/www/saas`)
  - `EC2_SSH_KEY` (path to private key, optional if using ssh-agent)
  - `EC2_SSH_PORT` (default 22)
- Usage:
  - `bash scripts/deploy.sh`
  - Optional: `SKIP_BUILD=1 bash scripts/deploy.sh`（直前のビルド成果物を再利用）
- What it does:
  - Builds Next.js (standalone), packages `.next/standalone`, `.next/static`, `public`, `ecosystem.config.js`, `scripts/prestart.sh`
  - Uploads `app.tar.gz` → extracts to `releases/<ts>` → links `shared/.env` → flips `current` symlink
  - Runs `scripts/prestart.sh` (Prisma migrate deploy) then `pm2 startOrReload ecosystem.config.js`

GitHub Actions (auto-deploy on push to main)
- Workflow: `.github/workflows/deploy.yml`
- Secrets required:
  - `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_PATH`, `EC2_SSH_PORT` (optional)
- Behavior:
  - Checkout → setup Node → `npm ci` → build (standalone) → package → scp to EC2 → extract → link → `prestart` → pm2 reload
- Trigger: push to `main` or manual dispatch


Migrations
- For initial setup, run `npx prisma migrate deploy` on the server manually (or via a maintenance job) before starting the new version.
- You can automate this by adding an SSH step before `pm2 reload` that executes the command with the correct environment.
App Features (Added)
- Default workspace on register: New users get a workspace + Owner membership.
- Pending invites management:
  - Duplicate email in the same workspace triggers resend (extends expiry) instead of error.
  - Resend/Cancel from Members page with search and role filter.
  - Copy invite link button (uses `/invites/<token>`).
  - Highlight expiring invites (default 24–48h window; configurable).
- UI filters:
  - Dashboard: filter workspaces by name/slug.
  - Tasks: text and status filters + sorting (Newest/Due/Status/Title), overdue/due soon badges.
  - Notes: text filter (title/body/tags), creator/dates display, tag badges.
- Basic security headers and simple rate limit via middleware (write APIs limited per IP/min).

Modal & Accessibility
- Reusable focus-trap hook: `src/components/useFocusTrap.ts` (ESC to close, Tab trap, initial focus)
- Generic `Modal` component: `src/components/Modal.tsx`
  - Usage example in tasks edit dialog (`app/workspaces/[id]/tasks-client.tsx`)

Env Vars (New)
- `NEXT_PUBLIC_INVITE_EXP_SOON_HOURS` (client): hours for “Expiring soon” highlight in Pending Invites.
  - Example: `NEXT_PUBLIC_INVITE_EXP_SOON_HOURS="24"` (default 48 if unset)

Seeding (Dev)
- Run: `npm run seed`
- Demo users:
  - `demo@example.com` / `Password1!` (Owner)
  - `alice@example.com` / `Password1!` (Member)
- Data: Demo workspace, tasks, and notes are created idempotently.
