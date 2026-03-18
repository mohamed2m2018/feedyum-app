import { formatDate, formatTime } from './helpers';

/**
 * Builds a well-formatted text receipt for sharing via the native Share API.
 * Uses Unicode box-drawing characters for a clean, professional look
 * that renders consistently across WhatsApp, Telegram, SMS, etc.
 */
export const buildReceiptText = ({ order, shortId, chefName, customerName, language, strings }) => {
  const currency = strings.currency || 'EGP';
  const line = '━'.repeat(28);

  const parts = [];

  // Header
  parts.push('🍕 *FeedYum*');
  parts.push(`📋 ${strings.orderReceipt}`);
  parts.push(line);

  // Order info
  parts.push(`🔖 ${strings.receiptOrderId} #${shortId}`);
  if (order.created_at) {
    parts.push(`📅 ${formatDate(order.created_at, language)}`);
    parts.push(`🕐 ${formatTime(order.created_at, language)}`);
  }
  parts.push(`👨‍🍳 ${chefName}`);
  parts.push(`👤 ${customerName}`);
  parts.push(line);

  // Items
  parts.push(`🛒 ${strings.orderItems}`);
  parts.push('');
  (order.items || []).forEach(item => {
    const name = item.dish?.name || '';
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.dish?.price || 0;
    const lineTotal = (unitPrice * qty).toFixed(2);
    parts.push(`  • ${name}`);
    parts.push(`    ${qty} × ${unitPrice.toFixed(2)} = ${lineTotal} ${currency}`);
  });
  parts.push('');
  parts.push(line);

  // Pricing
  parts.push(`${strings.subtotal}  ${order.subtotal?.toFixed(2) || '0.00'} ${currency}`);
  if (order.deliveryFee > 0) {
    parts.push(`${strings.deliveryFee}  ${order.deliveryFee.toFixed(2)} ${currency}`);
  }
  if (order.serviceFee > 0) {
    parts.push(`${strings.serviceFee || 'Service Fee'}  ${order.serviceFee.toFixed(2)} ${currency}`);
  }
  if (order.promocode?.discountAmount > 0) {
    parts.push(`🏷️ ${strings.discount} (${order.promocode.code})  -${order.promocode.discountAmount.toFixed(2)} ${currency}`);
  }
  parts.push(line);
  parts.push(`💰 *${strings.total}  ${order.totalPrice?.toFixed(2) || '0.00'} ${currency}*`);

  // Payment
  const paymentLabel = order.paymentMethod === 'cod'
    ? (strings.cashOnDelivery || 'Cash on Delivery')
    : (strings.online || 'Online');
  parts.push(`💳 ${paymentLabel}`);

  // Address
  if (order.deliveryAddress?.nameLine) {
    parts.push(`📍 ${order.deliveryAddress.nameLine}`);
  }

  parts.push('');
  parts.push(`✅ ${strings.thankYouForOrder}`);

  return parts.join('\n');
};
