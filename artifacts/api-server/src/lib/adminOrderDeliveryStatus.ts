type OrderReference = {
  reference: string;
};

type DeliveryStatus = {
  reference: string;
  deliveredAt: Date;
};

export async function loadAdminOrderDeliveryStatuses<T extends OrderReference>(
  orders: T[],
  loadStatuses: (references: string[]) => Promise<DeliveryStatus[]>,
): Promise<{
  orders: Array<T & { deliveredAt: string | null }>;
  deliveryTrackingAvailable: boolean;
  error: unknown | null;
}> {
  if (!orders.length) {
    return {
      orders: [],
      deliveryTrackingAvailable: true,
      error: null,
    };
  }

  try {
    const statuses = await loadStatuses(orders.map(order => order.reference));
    const deliveredByReference = new Map(
      statuses.map(status => [status.reference, status.deliveredAt.toISOString()]),
    );
    return {
      orders: orders.map(order => ({
        ...order,
        deliveredAt: deliveredByReference.get(order.reference) ?? null,
      })),
      deliveryTrackingAvailable: true,
      error: null,
    };
  } catch (error) {
    return {
      orders: orders.map(order => ({ ...order, deliveredAt: null })),
      deliveryTrackingAvailable: false,
      error,
    };
  }
}