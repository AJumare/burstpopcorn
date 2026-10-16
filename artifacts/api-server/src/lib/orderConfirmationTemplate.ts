import type { PaystackOrderProof } from './paystack';
import { formatDeliveryDate, getDeliverySchedule } from '@workspace/delivery-schedule';
import logo from '../assets/burst-email-logo.png';
import detail from '../assets/caramel-popcorn-detail.png';

// Background attributes use a public HTTPS image for Gmail compatibility.
// Keep a matching solid colour when a mail client blocks remote images.
export const EMAIL_BACKGROUND_URL = 'https://burst-popcorn-branding--ajumare.replit.app/email-assets/champagne-silk.jpg';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}

/** Embedded PNGs avoid dependence on website URLs or SVG support in mail clients. */
export function orderConfirmationMessage(order: PaystackOrderProof, paidAt: Date | string, deliveryDate?: string) {
  const deliveryLabel = deliveryDate ? formatDeliveryDate(deliveryDate) : getDeliverySchedule(paidAt).deliveryLabel;
  const total = new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(order.amountKobo / 100);
  const text = [
    `Hi ${order.customerName},`,
    '',
    'Your Burst Popcorn payment is confirmed. Thank you for your order!',
    '',
    `Order: ${order.reference}`,
    `Items: ${order.items}`,
    `Total paid: ${total} (including delivery)`,
    `Delivery day: ${deliveryLabel}`,
    `Delivery to: ${order.address}, ${order.state}`,
    'Delivery cutoffs: Tuesday 6pm for Wednesday; Friday 6pm for Saturday (Nigeria time, WAT).',
    '',
    'If you have a question about your order, reply to this email.',
    'Burst Popcorn Co.',
  ].join('\n');
  const serif = "Georgia,'Times New Roman',serif";
  const sans = 'Arial,Helvetica,sans-serif';
  const row = (label: string, value: string, last = false) => `
    <tr><td style="padding:14px 0;${last ? '' : 'border-bottom:1px solid #e3c995;'}font-family:${sans};font-size:14px;line-height:22px;color:#2b1f15;overflow-wrap:anywhere;word-break:break-word">
      <span style="font-size:11px;line-height:16px;letter-spacing:2px;color:#925b11;text-transform:uppercase;font-weight:bold">${label}</span><br>
      ${value}
    </td></tr>`;
  const bg = `background-color:#eee0cb;background-image:url('${EMAIL_BACKGROUND_URL}');background-position:center center;background-repeat:no-repeat;background-size:cover`;
  const html = `<!doctype html>
<html lang="en" style="height:100%">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Burst Popcorn order is confirmed</title></head>
<body bgcolor="#eee0cb" background="${EMAIL_BACKGROUND_URL}" style="margin:0;padding:0;height:100%;min-height:100vh;${bg}">
  <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"><v:fill type="tile" src="${EMAIL_BACKGROUND_URL}" color="#eee0cb"/></v:background><![endif]-->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Your payment is confirmed. Your Burst Popcorn order details are inside.</div>
  <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eee0cb" background="${EMAIL_BACKGROUND_URL}" style="height:100%;min-height:100vh;${bg}">
    <tr><td align="center" valign="middle" style="padding:32px 16px">
      <!--[if mso]><table role="presentation" width="580" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:580px;margin:0 auto">
        <tr><td bgcolor="#2b1f15" style="background-color:#2b1f15;padding:18px 24px;border-bottom:2px solid #d59a3d">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="56" valign="middle"><img src="cid:burst-email-logo" width="44" height="44" alt="Burst Popcorn Co. logo" style="display:block;width:44px;height:44px;border:0"></td>
            <td valign="middle">
              <p style="margin:0;color:#d59a3d;font-family:${serif};font-size:16px;line-height:22px;letter-spacing:3px;font-weight:bold">BURST POPCORN CO.</p>
              <p style="margin:2px 0 0;color:#faf6ee;font-family:${sans};font-size:10px;line-height:16px;letter-spacing:2px">GOURMET &middot; SMALL BATCH &middot; NIGERIA</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td bgcolor="#faf6ee" style="background-color:#faf6ee;padding:32px 28px 28px">
          <h1 style="margin:0 0 14px;font-family:${serif};font-size:32px;line-height:38px;font-weight:normal;color:#2b1f15">Your order is <em style="color:#b87a1c;font-style:italic">confirmed</em></h1>
          <table role="presentation" width="48" cellspacing="0" cellpadding="0" border="0"><tr><td height="1" bgcolor="#d59a3d" style="height:1px;line-height:1px;font-size:1px;background-color:#d59a3d">&nbsp;</td></tr></table>
          <p style="margin:18px 0 8px;font-family:${sans};font-size:14px;line-height:23px;color:#2b1f15">Hi ${escapeHtml(order.customerName)},</p>
          <p style="margin:0 0 22px;font-family:${sans};font-size:14px;line-height:23px;color:#2b1f15">Your payment is confirmed. Thank you for your order!</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d59a3d;border-bottom:1px solid #d59a3d">
            ${row('Order', escapeHtml(order.reference))}
            ${row('Items', escapeHtml(order.items))}
            ${row('Total paid', `${escapeHtml(total)} <span style="color:#796650">(including delivery)</span>`)}
            ${row('Delivery day', `<strong style="color:#9b651b">${escapeHtml(deliveryLabel)}</strong>`)}
            ${row('Delivery to', `${escapeHtml(order.address)}, ${escapeHtml(order.state)}`, true)}
          </table>
          <p style="margin:22px 0 14px;font-family:${sans};font-size:13px;line-height:22px;color:#2b1f15">If you have a question about your order, reply to this email.</p>
          <p style="margin:0;font-family:${serif};font-size:18px;line-height:24px;color:#925b11"><em>Something remarkable is popping.</em></p>
          <p style="margin:4px 0 0;font-family:${serif};font-size:15px;line-height:22px;color:#2b1f15">Burst Popcorn Co.</p>
        </td></tr>
        <tr><td bgcolor="#2b1f15" style="background-color:#2b1f15;font-size:0;line-height:0"><img src="cid:burst-caramel-detail" width="580" alt="Caramel popcorn detail" style="display:block;width:100%;max-width:580px;height:auto;border:0"></td></tr>
        <tr><td align="center" bgcolor="#2b1f15" style="background-color:#2b1f15;padding:14px 16px;font-family:${sans};font-size:10px;line-height:18px;letter-spacing:3px;color:#d59a3d;font-weight:bold">SMALL BATCH GOURMET POPCORN</td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body></html>`;
  return {
    text,
    html,
    attachments: [
      { filename: 'burst-logo.png', content: Buffer.from(logo, 'base64'), cid: 'burst-email-logo', contentType: 'image/png', contentDisposition: 'inline' as const },
      { filename: 'caramel-popcorn-detail.png', content: Buffer.from(detail, 'base64'), cid: 'burst-caramel-detail', contentType: 'image/png', contentDisposition: 'inline' as const },
    ],
  };
}