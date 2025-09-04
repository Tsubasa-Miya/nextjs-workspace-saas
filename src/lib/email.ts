import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const from = process.env.MAIL_FROM || '';

const ses = new SESv2Client({ region });

export async function sendEmail(params: { to: string; subject: string; html: string; text?: string }) {
  if (!from) throw new Error('MAIL_FROM not configured');
  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [params.to] },
    Content: {
      Simple: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.html, Charset: 'UTF-8' },
          Text: { Data: params.text ?? params.html.replace(/<[^>]+>/g, '') , Charset: 'UTF-8' },
        },
      },
    },
  });
  await ses.send(cmd);
}

