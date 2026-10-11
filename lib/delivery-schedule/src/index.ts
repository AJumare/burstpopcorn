// Nigeria uses WAT (UTC+1) year-round. Perform calendar arithmetic in shifted
// UTC so the visitor's or server's timezone cannot change a delivery date.
const WAT_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

export function getDeliverySchedule(paymentTime: Date | string) {
  if (typeof paymentTime === 'string' && !/(Z|[+-]\d{2}:\d{2})$/i.test(paymentTime)) {
    throw new Error('Delivery scheduling requires a payment timestamp with a timezone');
  }
  const timestamp = new Date(paymentTime).getTime();
  if (!Number.isFinite(timestamp)) throw new Error('Invalid payment timestamp for delivery scheduling');
  const local = new Date(timestamp + WAT_OFFSET_MS);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());

  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const cutoffDay = new Date(midnight + daysAhead * DAY_MS);
    const weekday = cutoffDay.getUTCDay();
    if (weekday !== 2 && weekday !== 5) continue;
    const cutoffAt = cutoffDay.getTime() + 18 * 60 * 60 * 1000 - WAT_OFFSET_MS;
    // At exactly 6pm the cutoff has closed; use the following delivery slot.
    if (timestamp >= cutoffAt) continue;
    const delivery = new Date(cutoffDay.getTime() + DAY_MS);
    return {
      deliveryDate: delivery.toISOString().slice(0, 10),
      deliveryLabel: dateFormatter.format(delivery),
      cutoffAt: new Date(cutoffAt).toISOString(),
      cutoffLabel: `${dateFormatter.format(cutoffDay)} at 6pm WAT`,
    };
  }
  throw new Error('Could not determine the next delivery slot');
}
