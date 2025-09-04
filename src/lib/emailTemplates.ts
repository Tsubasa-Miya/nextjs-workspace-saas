function baseTemplate(content: string) {
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SaaS Starter</title>
  </head>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f7fafc; padding:24px; color:#1a202c;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #edf2f7;">
        <strong style="font-size:16px;">SaaS Starter</strong>
      </div>
      <div style="padding:24px;">
        ${content}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #edf2f7;color:#718096;font-size:12px;">
        This is an automated message. Please do not reply.
      </div>
    </div>
  </body>
  </html>`;
}

export function inviteEmailTemplate(params: { acceptUrl: string; expiresAt: Date }) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 12px;">You are invited</h2>
    <p style="margin:0 0 16px;">You have been invited to join a workspace.</p>
    <p style="margin:0 0 16px;">This link expires on <strong>${params.expiresAt.toISOString()}</strong>.</p>
    <p style="margin:0 0 24px;"><a href="${params.acceptUrl}" style="padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
    <p>If the button does not work, copy and paste this URL:</p>
    <p style="word-break:break-all;"><a href="${params.acceptUrl}">${params.acceptUrl}</a></p>
  `);
  const text = `You have been invited to join a workspace.\nAccept: ${params.acceptUrl}\nExpires: ${params.expiresAt.toISOString()}`;
  return { html, text };
}

export function resetEmailTemplate(params: { resetUrl: string }) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 12px;">Password reset</h2>
    <p style="margin:0 0 16px;">Click the button below to reset your password.</p>
    <p style="margin:0 0 24px;"><a href="${params.resetUrl}" style="padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p>If the button does not work, copy and paste this URL:</p>
    <p style="word-break:break-all;"><a href="${params.resetUrl}">${params.resetUrl}</a></p>
  `);
  const text = `Reset your password: ${params.resetUrl}`;
  return { html, text };
}

