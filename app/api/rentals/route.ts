import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderRentalNumber, cancelRental, getRentalMessages, applyMarkup } from '@/lib/smspool';
import { acquireRequestLock, consumeRateLimit, createRentalWithDebit, generateRentalId, getRental, getUserById, getUserRentals, releaseRequestLock, updateRental } from '@/lib/db';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';
import type { PlanTier } from '@/lib/types';
import { PLAN_DURATIONS } from '@/lib/types';

export async function POST(request: NextRequest) {
  let purchaseLockKey: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    }
    const allowed = await consumeRateLimit({
      scope: 'rental-order', key: requestRateLimitKey(request, user.id), limit: 5, windowSeconds: 30 * 60,
    });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many rental requests. Please try again later.' }, { status: 429 });
    }
    const locked = await acquireRequestLock({ scope: 'paid-purchase', key: user.id });
    if (!locked) {
      return NextResponse.json({ error: 'A purchase is already being processed for this account. Please wait a moment.' }, { status: 409 });
    }
    purchaseLockKey = user.id;

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

    // Quick balance pre-check to avoid wasting an upstream purchase
    const dbUserPrecheck = await getUserById(user.id);
    if (!dbUserPrecheck || Number(dbUserPrecheck.balanceCents) <= 0) {
      return NextResponse.json({ error: 'Insufficient balance. Please add funds to your wallet.' }, { status: 400 });
    }

    // Order rental number for the specified number of days
    const result = await orderRentalNumber(country, planConfig.days, service);

    const cost = applyMarkup(Math.round((Number(result.price) || 0) * (1 - planConfig.discount / 100) * 100) / 100);
    const rentalId = generateRentalId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + planConfig.days * 24 * 60 * 60 * 1000).toISOString();

    // Atomic: save rental + deduct balance in a single transaction
    await createRentalWithDebit({ id: rentalId, userId: user.id, phoneNumber: String(result.number), country, service, status: 'active', plan, cost, smspoolRentalId: result.rental_code, startedAt: now, expiresAt, renewedAt: null });

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
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
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
    let message = error instanceof Error ? error.message : 'Failed to cancel rental.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
