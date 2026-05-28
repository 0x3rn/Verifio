import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { orderRentalNumber, cancelRental, getRentalCodes } from '@/lib/smspool';
import { saveRental, getRental, getUserRentals, updateRental, generateRentalId } from '@/lib/store';
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

    // Order rental number with SMSPool for the specified number of days
    const result = await orderRentalNumber(country, service, planConfig.days);

    const rentalId = generateRentalId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + planConfig.days * 24 * 60 * 60 * 1000).toISOString();

    // Apply discount to the cost
    const discountedCost = result.price * (1 - planConfig.discount / 100);

    const rental: RentalNumber = {
      id: rentalId,
      userId: user.id,
      phoneNumber: result.number,
      country,
      service,
      status: 'active',
      plan,
      cost: Math.round(discountedCost * 100) / 100,
      smspoolRentalId: result.order_id,
      startedAt: now,
      expiresAt,
      renewedAt: null,
    };

    saveRental(rental);

    return NextResponse.json({
      success: true,
      rental: {
        id: rental.id,
        phoneNumber: rental.phoneNumber,
        country: rental.country,
        service: rental.service,
        status: rental.status,
        plan: rental.plan,
        cost: rental.cost,
        startedAt: rental.startedAt,
        expiresAt: rental.expiresAt,
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
      const rental = getRental(rentalId);
      if (!rental || rental.userId !== user.id) {
        return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
      }

      // If action is 'codes', fetch SMS codes for this rental
      if (action === 'codes') {
        const codes = await getRentalCodes(rental.smspoolRentalId);
        return NextResponse.json({
          rental,
          codes: codes.success === 1 ? codes.sms_list || [] : [],
        });
      }

      return NextResponse.json({ rental });
    }

    // Otherwise return all rentals
    const rentals = getUserRentals(user.id);
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

    const rental = getRental(rentalId);
    if (!rental || rental.userId !== user.id) {
      return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
    }

    await cancelRental(rental.smspoolRentalId);
    updateRental(rentalId, { status: 'cancelled' });

    return NextResponse.json({ success: true, message: 'Rental cancelled successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel rental.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}