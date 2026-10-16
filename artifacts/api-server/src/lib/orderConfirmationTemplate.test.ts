import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderConfirmationMessage } from './orderConfirmationTemplate';

const order = {
  reference: 'TEST-NO-PAYMENT',
  amountKobo: 100000,
  customerName: 'Test Customer',
  phone: 'Not applicable',
  address: 'Sample address',
  state: 'Sample state',
  items: 'Salted Caramel — sample item',
};
const paidAt = '2026-10-06T16:00:00Z';

test('keeps all payment and delivery details in the HTML and text versions', () => {
  const message = orderConfirmationMessage(order, paidAt);
  for (const value of [order.reference, order.customerName, order.items, order.address, order.state]) {
    assert.ok(message.html.includes(value));
    assert.ok(message.text.includes(value));
  }
  assert.ok(message.html.includes('₦1,000'));
  assert.ok(message.text.includes('₦1,000'));
  assert.ok(message.text.includes('(including delivery)'));
});

test('escapes customer-supplied content without escaping the plain-text version', () => {
  const malicious = '<img src=x onerror="alert(1)"> & \'';
  const message = orderConfirmationMessage({
    ...order, customerName: malicious, items: malicious, address: malicious, state: malicious,
  }, paidAt);
  assert.ok(!message.html.includes(malicious));
  assert.ok(message.html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;'));
  assert.ok(message.text.includes(malicious));
});

test('uses website branding and a caramel detail, without the reference photo or scattered popcorn', () => {
  const message = orderConfirmationMessage(order, paidAt);
  const ids = [...message.html.matchAll(/src="cid:([^"]+)"/g)].map(match => match[1]);
  for (const id of ids) assert.ok(message.attachments.some(attachment => attachment.cid === id));
  assert.equal(message.attachments.length, 2);
  assert.ok(message.attachments.some(attachment => attachment.cid === 'burst-email-logo'));
  assert.ok(message.attachments.some(attachment => attachment.cid === 'burst-caramel-detail'));
  assert.ok(!message.html.includes('burst-product-packaging'));
  assert.equal(ids.length, 2);
  assert.ok(!message.html.includes('burst-popcorn-rain'));
  assert.ok(message.html.includes('bgcolor="#2b1f15"'));
  assert.ok(message.html.includes('min-height:100vh'));
  assert.match(message.html, /<td[^>]*align="center"[^>]*valign="middle"/);
  for (const attachment of message.attachments) {
    assert.equal(attachment.contentType, 'image/png');
    assert.equal(attachment.contentDisposition, 'inline');
    assert.ok(attachment.content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  }
  assert.ok(message.html.includes('BURST POPCORN CO.'));
  assert.ok(message.html.includes('bgcolor="#eee0cb"'));
  assert.ok(message.html.includes('/email-assets/champagne-silk.jpg'));
  assert.ok(message.html.includes('urn:schemas-microsoft-com:vml'));
  assert.ok(!message.html.includes('<svg'));
  assert.ok(!message.html.includes('<script'));
  assert.ok(!/<img\b[^>]*src="http/i.test(message.html));
});

test('includes the payment-based delivery date in HTML and plain text', () => {
  for (const [time, label] of [
    ['2026-10-06T16:59:59Z', 'Wednesday, 7 October 2026'],
    ['2026-10-06T17:00:00Z', 'Saturday, 10 October 2026'],
    ['2026-10-09T16:59:59Z', 'Saturday, 10 October 2026'],
    ['2026-10-09T17:00:00Z', 'Wednesday, 14 October 2026'],
  ]) {
    const message = orderConfirmationMessage(order, time);
    assert.ok(message.html.includes(label));
    assert.ok(message.text.includes(`Delivery day: ${label}`));
  }
});