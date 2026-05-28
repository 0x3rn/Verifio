import type { VerificationOrder, RentalNumber } from './types';

// In-memory stores (in production, use a real database)
function getOrdersMap(): Map<string, VerificationOrder> {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as Record<string, unknown>).__verifio_orders) {
      (globalThis as Record<string, unknown>).__verifio_orders = new Map<string, VerificationOrder>();
    }
    return (globalThis as Record<string, unknown>).__verifio_orders as Map<string, VerificationOrder>;
  }
  return new Map<string, VerificationOrder>();
}

function getRentalsMap(): Map<string, RentalNumber> {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as Record<string, unknown>).__verifio_rentals) {
      (globalThis as Record<string, unknown>).__verifio_rentals = new Map<string, RentalNumber>();
    }
    return (globalThis as Record<string, unknown>).__verifio_rentals as Map<string, RentalNumber>;
  }
  return new Map<string, RentalNumber>();
}

// Order helpers
export function saveOrder(order: VerificationOrder): void {
  getOrdersMap().set(order.id, order);
}

export function getOrder(orderId: string): VerificationOrder | undefined {
  return getOrdersMap().get(orderId);
}

export function getUserOrders(userId: string): VerificationOrder[] {
  const orders: VerificationOrder[] = [];
  for (const order of getOrdersMap().values()) {
    if (order.userId === userId) {
      orders.push(order);
    }
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateOrder(orderId: string, updates: Partial<VerificationOrder>): VerificationOrder | undefined {
  const order = getOrdersMap().get(orderId);
  if (!order) return undefined;
  const updated = { ...order, ...updates };
  getOrdersMap().set(orderId, updated);
  return updated;
}

// Rental helpers
export function saveRental(rental: RentalNumber): void {
  getRentalsMap().set(rental.id, rental);
}

export function getRental(rentalId: string): RentalNumber | undefined {
  return getRentalsMap().get(rentalId);
}

export function getUserRentals(userId: string): RentalNumber[] {
  const rentals: RentalNumber[] = [];
  for (const rental of getRentalsMap().values()) {
    if (rental.userId === userId) {
      rentals.push(rental);
    }
  }
  return rentals.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function updateRental(rentalId: string, updates: Partial<RentalNumber>): RentalNumber | undefined {
  const rental = getRentalsMap().get(rentalId);
  if (!rental) return undefined;
  const updated = { ...rental, ...updates };
  getRentalsMap().set(rentalId, updated);
  return updated;
}

// Generate IDs
export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateRentalId(): string {
  return `rental_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}