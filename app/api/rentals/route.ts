import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderRentalNumber, cancelRental, getRentalMessages } from '@/lib/smspool';
import { prisma, saveRental, getRental, getUserRentals, updateRental, generateRentalId } from '@/lib/db';
import type { RentalNumber, PlanTier } from '@/lib/types';
import { PLAN_DURATIONS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { country, service, plan } = body as { country: string; service: string; plan: PlanTier };

    if (!country || !service || !plan) {
      return NextResponse.json(
        { error: 'Country, service, and plan are required.' },
        { status: 400 }
      );
    }

    const planConfig = PLAN_DURATIONS[plan];
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    // Order rental number for the specified number of days
    const result = await orderRentalNumber(country, planConfig.days, service);

    const cost = Math.round(result.price * (1 - planConfig.discount / 100) * 100) / 100;
    const rentalId = generateRentalId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + planConfig.days * 24 * 60 * 60 * 1000).toISOString();

    // Atomic: save rental + deduct balance in a single transaction
    await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!dbUser || dbUser.balance < cost) {
        throw new Error('Insufficient balance. Please add funds to your wallet.');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: cost } },
      });

      await tx.rental.create({
        data: {
          id: rentalId,
          userId: user.id,
          phoneNumber: result.number,
          country,
          service,
          status: 'active',
          plan,
          cost,
          smspoolRentalId: result.rental_code,
          startedAt: new Date(now),
          expiresAt: new Date(expiresAt),
          renewedAt: null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      rental: {
        id: rentalId,
        phoneNumber: result.number,
        country,
        service,
        status: 'active',
        plan,
        cost,
        startedAt: now,
        expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to order rental number.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rentalId = searchParams.get('rentalId');
    const action = searchParams.get('action');

    // If rentalId is provided, get specific rental or its codes
    if (rentalId) {
      const rental = await getRental(rentalId);
      if (!rental || rental.userId !== user.id) {
        return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
      }

      // If action is 'codes', fetch SMS codes for this rental
      if (action === 'codes') {
        const codes = await getRentalMessages(rental.smspoolRentalId);
        return NextResponse.json({
          rental,
          codes: codes.success === 1 ? codes.sms_list || [] : [],
        });
      }

      return NextResponse.json({ rental });
    }

    // Otherwise return all rentals
    const rentals = await getUserRentals(user.id);
    return NextResponse.json({ rentals });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rentals.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rentalId = searchParams.get('rentalId');

    if (!rentalId) {
      return NextResponse.json({ error: 'Rental ID is required.' }, { status: 400 });
    }

    const rental = await getRental(rentalId);
    if (!rental || rental.userId !== user.id) {
      return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
    }

    await cancelRental(rental.smspoolRentalId);
    await updateRental(rentalId, { status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Rental cancelled successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel rental.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}