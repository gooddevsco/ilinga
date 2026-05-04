import { render, type RenderedEmail, type BrandInput } from './render.js';

export interface MagicLinkData {
  recipientName?: string | null;
  url: string;
  purpose:
    | 'signup'
    | 'signin'
    | 'tenant_invite'
    | 'email_change_verify'
    | 'account_recovery'
    | 'step_up';
  expiresInMinutes: number;
  brand?: BrandInput;
}

const purposeCopy = {
  signup: {
    heading: 'Confirm your email to get started',
    body: 'Thanks for signing up to Ilinga. Click below to confirm your email and create your workspace.',
    cta: 'Confirm email',
  },
  signin: {
    heading: 'Sign in to Ilinga',
    body: 'Click the button below to sign in to your account.',
    cta: 'Sign in',
  },
  tenant_invite: {
    heading: 'You’ve been invited to a workspace',
    body: 'Accept the invitation to join the team.',
    cta: 'Accept invite',
  },
  email_change_verify: {
    heading: 'Verify your new email',
    body: 'Confirm your new email so we can update your account.',
    cta: 'Verify email',
  },
  account_recovery: {
    heading: 'Recover your account',
    body: 'Use the link below to sign back in. We will send a separate alert to your previous email if anything changes.',
    cta: 'Recover account',
  },
  step_up: {
    heading: 'Confirm a sensitive action',
    body: 'Click the button below to authorise this sensitive action. The link expires shortly.',
    cta: 'Authorise',
  },
} as const;

export const renderMagicLinkEmail = (data: MagicLinkData): RenderedEmail => {
  const copy = purposeCopy[data.purpose];
  const greeting = data.recipientName ? `Hi ${data.recipientName},<br/><br/>` : '';
  const body = `${greeting}${copy.body}<br/><br/>This link expires in ${data.expiresInMinutes} minutes.`;
  return render({
    heading: copy.heading,
    body,
    ctaLabel: copy.cta,
    ctaUrl: data.url,
    brand: data.brand,
  });
};

export interface NewDeviceAlertData {
  ip: string;
  userAgent: string;
  timestamp: string;
  notMeUrl: string;
  brand?: BrandInput;
}
export const renderNewDeviceAlertEmail = (data: NewDeviceAlertData): RenderedEmail =>
  render({
    heading: `New sign-in to your ${data.brand?.name ?? 'Ilinga'} account`,
    body: `We saw a new sign-in from <b>${data.ip}</b> using <b>${data.userAgent}</b> at ${data.timestamp}. If this was you, no action is needed.`,
    ctaLabel: 'This wasn’t me',
    ctaUrl: data.notMeUrl,
    brand: data.brand,
  });

export interface PaymentReceiptData {
  invoiceNumber: string;
  amount: string;
  date: string;
  pdfUrl: string;
  brand?: BrandInput;
}
export const renderPaymentReceiptEmail = (data: PaymentReceiptData): RenderedEmail =>
  render({
    heading: `Receipt ${data.invoiceNumber}`,
    body: `Thanks for your payment of <b>${data.amount}</b> on ${data.date}. Your invoice PDF is attached and can be downloaded below.`,
    ctaLabel: 'Download invoice',
    ctaUrl: data.pdfUrl,
    brand: data.brand,
  });

export interface LowCreditsData {
  remaining: number;
  topUpUrl: string;
  brand?: BrandInput;
}
export const renderLowCreditsEmail = (data: LowCreditsData): RenderedEmail =>
  render({
    heading: 'Your credit balance is running low',
    body: `You have <b>${data.remaining}</b> credits remaining. Top up to keep new synthesis runs and reports flowing without interruption.`,
    ctaLabel: 'Top up credits',
    ctaUrl: data.topUpUrl,
    brand: data.brand,
  });
