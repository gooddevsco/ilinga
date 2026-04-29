import {
  buildSender,
  inMemorySender,
  type Sender,
  type SendInput,
  type ProviderName,
} from '@ilinga/emails';
import { schema, getDb } from '@ilinga/db';
import { config } from '../config.js';

let cached: Sender | null = null;
const memorySink: SendInput[] = [];

export const getMailer = (): Sender => {
  if (cached) return cached;
  const cfg = config();
  if (cfg.NODE_ENV === 'test') {
    cached = inMemorySender(memorySink);
    return cached;
  }
  const primary = cfg.IL_EMAIL_PRIMARY as ProviderName;
  const failover = cfg.IL_EMAIL_FAILOVER as ProviderName;
  cached = buildSender({
    primary,
    failover,
    resendApiKey: process.env.RESEND_API_KEY,
    postmarkApiKey: process.env.POSTMARK_API_KEY,
    smtpHost: cfg.IL_EMAIL_SMTP_HOST,
    smtpPort: cfg.IL_EMAIL_SMTP_PORT,
  });
  return cached;
};

export const __getMemorySink = (): readonly SendInput[] => memorySink;

export interface SendTrackedInput {
  template: string;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  tenantId?: string | null;
  userId?: string | null;
}

export const sendTracked = async (input: SendTrackedInput): Promise<void> => {
  const cfg = config();
  const mailer = getMailer();
  let providerName: string = 'unknown';
  let providerMessageId: string | null = null;
  let lastError: string | null = null;
  let status = 'sent';

  try {
    const result = await mailer.send({
      to: input.toEmail,
      from: cfg.IL_EMAIL_FROM,
      replyTo: cfg.IL_EMAIL_REPLY_TO,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: { template: input.template },
    });
    providerName = result.provider;
    providerMessageId = result.providerMessageId;
  } catch (err) {
    status = 'failed';
    lastError = (err as Error).message;
  }

  if (cfg.NODE_ENV === 'test') return;

  await getDb().insert(schema.emailMessages).values({
    tenantId: input.tenantId ?? null,
    userId: input.userId ?? null,
    template: input.template,
    subject: input.subject,
    toEmail: input.toEmail,
    fromEmail: cfg.IL_EMAIL_FROM,
    provider: providerName,
    providerMessageId: providerMessageId ?? null,
    status,
    lastError,
    sentAt: status === 'sent' ? new Date() : null,
  });
};
