import 'server-only'
import QRCode from 'qrcode'
import { sendEmail } from '@/lib/email'
import { formatUsd } from '@/lib/money'
import { getSiteSettings } from '@/lib/site-settings'
import { orderScanUrl, type Order } from '@/lib/shop'

/**
 * Merch order confirmation email: order number, item list, pickup
 * instructions, and the pickup QR code as a PNG attachment. The QR encodes
 * the admin scan URL (/admin/orders?scan=<orderId>) — staff scan it at
 * pickup to open the order and mark it collected.
 * Best-effort — the order exists whether or not the email lands.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const settings = await getSiteSettings()
  const scanUrl = orderScanUrl(order.id)
  const qrPng = await QRCode.toBuffer(scanUrl, { errorCorrectionLevel: 'M', width: 600, margin: 2 })
  // Greet by first name; orders that predate name capture get the generic line.
  const greeting = order.firstName ? `Hi ${escapeHtml(order.firstName)}, thank you` : 'Thank you'

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 6px 12px 6px 0; font-size: 15px;">${escapeHtml(item.title)}</td>
          <td style="padding: 6px 12px 6px 0; font-size: 15px; text-align: center;">${item.qty}</td>
          <td style="padding: 6px 0; font-size: 15px; text-align: right;">${formatUsd(item.priceCents * item.qty)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; color: #8a6d3b; margin: 0 0 8px;">
        Amazing Grace Ministries MN
      </p>
      <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 16px;">
        Order ${escapeHtml(order.orderNumber)} confirmed
      </h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        ${greeting} — your payment was received. Your order will be ready for pickup at
        <strong>Sunday service, ${settings.address.street}, ${settings.address.city}</strong>.
      </p>
      <table style="border-collapse: collapse; margin: 0 0 8px;">
        ${itemRows}
        <tr>
          <td colspan="2" style="padding: 10px 12px 0 0; font-size: 15px; border-top: 1px solid #ddd;"><strong>Total</strong></td>
          <td style="padding: 10px 0 0; font-size: 15px; text-align: right; border-top: 1px solid #ddd;"><strong>${formatUsd(order.totalCents)}</strong></td>
        </tr>
      </table>
      <p style="font-size: 15px; line-height: 1.6; margin: 16px 0 24px;">
        <strong>Pickup:</strong> bring this email to the merch table at Sunday service — the
        attached QR code (${escapeHtml(order.orderNumber)}) is your pickup pass. A team member
        will scan it and hand you your order.
      </p>
      <p style="font-size: 13px; color: #666; margin: 0;">
        Amazing Grace Ministries · 715 Edgerton Street, Saint Paul, MN 55130
      </p>
    </div>
  `.trim()

  return sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — pickup at Sunday service`,
    html,
    attachments: [
      {
        filename: `pickup-qr-${order.orderNumber}.png`,
        content: qrPng.toString('base64'),
      },
    ],
  })
}
