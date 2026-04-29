export { render, type RenderInput, type RenderedEmail } from './render.js';
export {
  renderMagicLinkEmail,
  renderNewDeviceAlertEmail,
  renderPaymentReceiptEmail,
  renderLowCreditsEmail,
  type MagicLinkData,
  type NewDeviceAlertData,
  type PaymentReceiptData,
  type LowCreditsData,
} from './templates.js';
export {
  buildSender,
  inMemorySender,
  type Sender,
  type SenderConfig,
  type SendInput,
  type SendResult,
  type ProviderName,
} from './sender.js';
