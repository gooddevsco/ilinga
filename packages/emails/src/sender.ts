import nodemailer, { type Transporter } from 'nodemailer';

export type ProviderName = 'resend' | 'postmark' | 'smtp' | 'in-memory';

export interface SendInput {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  tags?: Record<string, string>;
}

export interface SendResult {
  provider: ProviderName;
  providerMessageId: string;
}

export interface SenderConfig {
  primary: ProviderName;
  failover?: ProviderName;
  resendApiKey?: string;
  postmarkApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
}

export interface Sender {
  send(input: SendInput): Promise<SendResult>;
}

const sendViaResend = async (apiKey: string, input: SendInput): Promise<SendResult> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags
        ? Object.entries(input.tags).map(([name, value]) => ({ name, value }))
        : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { id: string };
  return { provider: 'resend', providerMessageId: body.id };
};

const sendViaPostmark = async (apiKey: string, input: SendInput): Promise<SendResult> => {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify({
      From: input.from,
      To: input.to,
      ReplyTo: input.replyTo,
      Subject: input.subject,
      HtmlBody: input.html,
      TextBody: input.text,
      MessageStream: 'outbound',
    }),
  });
  if (!res.ok) throw new Error(`Postmark send failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { MessageID: string };
  return { provider: 'postmark', providerMessageId: body.MessageID };
};

const buildSmtp = (host: string, port: number): Transporter =>
  nodemailer.createTransport({ host, port, secure: false });

const sendViaSmtp = async (
  transport: Transporter,
  input: SendInput,
): Promise<SendResult> => {
  const info = await transport.sendMail({
    from: input.from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { provider: 'smtp', providerMessageId: info.messageId };
};

export const inMemorySender = (sink: SendInput[]): Sender => ({
  async send(input) {
    sink.push(input);
    return { provider: 'in-memory', providerMessageId: `mem_${sink.length}` };
  },
});

export const buildSender = (cfg: SenderConfig): Sender => {
  const smtp =
    cfg.smtpHost && cfg.smtpPort ? buildSmtp(cfg.smtpHost, cfg.smtpPort) : null;

  const sendOnce = async (provider: ProviderName, input: SendInput): Promise<SendResult> => {
    if (provider === 'resend') {
      if (!cfg.resendApiKey) throw new Error('resendApiKey not set');
      return sendViaResend(cfg.resendApiKey, input);
    }
    if (provider === 'postmark') {
      if (!cfg.postmarkApiKey) throw new Error('postmarkApiKey not set');
      return sendViaPostmark(cfg.postmarkApiKey, input);
    }
    if (provider === 'smtp') {
      if (!smtp) throw new Error('smtpHost/smtpPort not set');
      return sendViaSmtp(smtp, input);
    }
    throw new Error(`unknown provider: ${provider}`);
  };

  return {
    async send(input) {
      try {
        return await sendOnce(cfg.primary, input);
      } catch (err) {
        if (!cfg.failover || cfg.failover === cfg.primary) throw err;
        return sendOnce(cfg.failover, input);
      }
    },
  };
};
