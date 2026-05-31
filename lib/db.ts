import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import type { VerificationOrder, RentalNumber } from './types';

// Order helpers
export async function saveOrder(order: VerificationOrder): Promise<void> {
  await prisma.order.create({
    data: {
      id: order.id,
      userId: order.userId,
      service: order.service,
      country: order.country,
      phoneNumber: order.phoneNumber,
      code: order.code || null,
      status: order.status,
      type: order.type,
      cost: order.cost,
      smspoolOrderId: order.smspoolOrderId,
      createdAt: new Date(order.createdAt),
      completedAt: order.completedAt ? new Date(order.completedAt) : null,
      expiresAt: new Date(order.expiresAt),
    },
  });
}

export async function getOrder(orderId: string): Promise<VerificationOrder | undefined> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return undefined;

  return {
    ...order,
    code: order.code || '',
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    expiresAt: order.expiresAt.toISOString(),
  } as VerificationOrder;
}

export async function getUserOrders(userId: string): Promise<VerificationOrder[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(order => ({
    ...order,
    code: order.code || '',
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    expiresAt: order.expiresAt.toISOString(),
  })) as VerificationOrder[];
}

export async function updateOrder(orderId: string, updates: Partial<VerificationOrder>): Promise<VerificationOrder | undefined> {
  const data: any = { ...updates };
  if (updates.createdAt) data.createdAt = new Date(updates.createdAt);
  if (updates.completedAt) data.completedAt = new Date(updates.completedAt);
  if (updates.expiresAt) data.expiresAt = new Date(updates.expiresAt);

  const order = await prisma.order.update({
    where: { id: orderId },
    data,
  });

  return {
    ...order,
    code: order.code || '',
    createdAt: order.createdAt.toISOString(),
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    expiresAt: order.expiresAt.toISOString(),
  } as VerificationOrder;
}

// Rental helpers
export async function saveRental(rental: RentalNumber): Promise<void> {
  await prisma.rental.create({
    data: {
      id: rental.id,
      userId: rental.userId,
      phoneNumber: rental.phoneNumber,
      country: rental.country,
      service: rental.service,
      status: rental.status,
      plan: rental.plan,
      cost: rental.cost,
      smspoolRentalId: rental.smspoolRentalId,
      startedAt: new Date(rental.startedAt),
      expiresAt: new Date(rental.expiresAt),
      renewedAt: rental.renewedAt ? new Date(rental.renewedAt) : null,
    },
  });
}

export async function getRental(rentalId: string): Promise<RentalNumber | undefined> {
  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental) return undefined;

  return {
    ...rental,
    startedAt: rental.startedAt.toISOString(),
    expiresAt: rental.expiresAt.toISOString(),
    renewedAt: rental.renewedAt ? rental.renewedAt.toISOString() : null,
  } as RentalNumber;
}

export async function getUserRentals(userId: string): Promise<RentalNumber[]> {
  const rentals = await prisma.rental.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  });

  return rentals.map(rental => ({
    ...rental,
    startedAt: rental.startedAt.toISOString(),
    expiresAt: rental.expiresAt.toISOString(),
    renewedAt: rental.renewedAt ? rental.renewedAt.toISOString() : null,
  })) as RentalNumber[];
}

export async function updateRental(rentalId: string, updates: Partial<RentalNumber>): Promise<RentalNumber | undefined> {
  const data: any = { ...updates };
  if (updates.startedAt) data.startedAt = new Date(updates.startedAt);
  if (updates.expiresAt) data.expiresAt = new Date(updates.expiresAt);
  if (updates.renewedAt) data.renewedAt = new Date(updates.renewedAt);

  const rental = await prisma.rental.update({
    where: { id: rentalId },
    data,
  });

  return {
    ...rental,
    startedAt: rental.startedAt.toISOString(),
    expiresAt: rental.expiresAt.toISOString(),
    renewedAt: rental.renewedAt ? rental.renewedAt.toISOString() : null,
  } as RentalNumber;
}

export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateRentalId(): string {
  return `rental_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}