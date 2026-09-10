import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { applyMarkup } from '@/lib/smspool';
import {
  getTextVerifiedRentalInventory,
  getTextVerifiedRentalMessages,
  getTextVerifiedRentalOptions,
  getTextVerifiedRentalPrice,
  isTextVerifiedConfigured,
  orderTextVerifiedRental,
  refundTextVerifiedRental,
  wakeTextVerifiedRental,
  type TextVerifiedRentalRequest,
} from '@/lib/textverified';
import {
  acquireRequestLock,
  consumeRateLimit,
  createRentalWithDebit,
  generateRentalId,
  getRental,
  getUserById,
  getUserRentals,
  releaseRequestLock,
  updateRental,
} from '@/lib/db';
import { isSameOriginRequest, requestRateLimitKey } from '@/lib/request-security';
import { TEXTVERIFIED_RENTAL_DURATIONS, type TextVerifiedRentalDuration } from '@/lib/types';

const VALID_DURATIONS = new Set(TEXTVERIFIED_RENTAL_DURATIONS.map((option) => option.value));

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isValidAreaCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{3}$/.test(value);
}

function getDurationOption(duration: TextVerifiedRentalDuration) {
  return TEXTVERIFIED_RENTAL_DURATIONS.find((option) => option.value === duration);
}

function parseRentalRequest(body: unknown): TextVerifiedRentalRequest & { country: string; serviceScope: 'specific' | 'all' } {
  if (!body || typeof body !== 'object') throw new Error('Rental request must be a JSON object.');
  const input = body as Record<string, unknown>;
  const country = typeof input.country === 'string' ? input.country.toUpperCase() : '';
  const serviceScope = input.serviceScope === 'all' ? 'all' : input.serviceScope === 'specific' ? 'specific' : null;
  const serviceName = typeof input.serviceName === 'string' ? input.serviceName.trim() : '';
  const duration = typeof input.duration === 'string' ? input.duration : null;
  const areaCodes = Array.isArray(input.areaCodeSelectOption) ? input.areaCodeSelectOption : [];
  const alwaysOn = input.alwaysOn;
  const allowBackOrderReservations = input.allowBackOrderReservations;

  if (country !== 'US') throw new Error('Text Verified rentals currently support US numbers only.');
  if (!serviceScope) throw new Error('Choose whether the number is for one service or all services.');
  if (serviceScope === 'all' && serviceName !== 'allservices') throw new Error('All-service rentals must use the allservices service.');
  if (serviceScope === 'all' && input.isRenewable !== true) throw new Error('All-service rentals require a renewable 30-day cycle.');
  if (serviceScope === 'specific' && (!serviceName || serviceName === 'allservices')) throw new Error('Choose a service for this rental.');
  if (!duration || !VALID_DURATIONS.has(duration as TextVerifiedRentalDuration)) throw new Error('Choose a valid Text Verified rental duration.');
  if (!isBoolean(input.isRenewable)) throw new Error('Choose whether the rental should renew.');
  if (!isBoolean(alwaysOn)) throw new Error('Choose a message access mode.');
  if (!isBoolean(allowBackOrderReservations)) throw new Error('Choose whether to allow a back order.');
  if (areaCodes.length > 1 || areaCodes.some((areaCode) => !isValidAreaCode(areaCode))) {
    throw new Error('Choose one valid three-digit US area code or leave area code selection open.');
  }

  const normalizedDuration = duration as TextVerifiedRentalDuration;
  const durationOption = getDurationOption(normalizedDuration);
  if (!durationOption) throw new Error('Choose a valid Text Verified rental duration.');
  if (durationOption.renewable !== Boolean(input.isRenewable)) {
    throw new Error('The selected duration is not compatible with the selected renewability.');
  }

  return {
    country,
    serviceScope,
    allowBackOrderReservations,
    duration: normalizedDuration,
    isRenewable: input.isRenewable,
    numberType: 'mobile',
    serviceName,
    capability: 'sms',
    alwaysOn,
    areaCodeSelectOption: areaCodes.length ? areaCodes as string[] : null,
    billingCycleIdToAssignTo: null,
  };
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = /required|choose|support|valid|compatible|available/i.test(message) ? 400 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get('config') === '1') {
      if (!isTextVerifiedConfigured()) return NextResponse.json({ error: 'Text Verified is not configured.' }, { status: 503 });
      const options = await getTextVerifiedRentalOptions();
      return NextResponse.json({ provider: 'textverified', country: 'US', services: options.services, areaCodes: options.areaCodes, durations: TEXTVERIFIED_RENTAL_DURATIONS });
    }

    if (searchParams.get('quote') === '1') {
      const duration = searchParams.get('duration') as TextVerifiedRentalDuration;
      const isRenewable = searchParams.get('isRenewable') === 'true';
      const serviceName = searchParams.get('serviceName') || '';
      const areaCode = searchParams.get('areaCode');
      const requestData: TextVerifiedRentalRequest = {
        allowBackOrderReservations: false,
        duration,
        isRenewable,
        numberType: 'mobile',
        serviceName,
        capability: 'sms',
        alwaysOn: searchParams.get('alwaysOn') === 'true',
        areaCodeSelectOption: areaCode ? [areaCode] : [],
        billingCycleIdToAssignTo: null,
      };
      const option = getDurationOption(duration);
      if (!option || option.renewable !== isRenewable || !serviceName) return NextResponse.json({ error: 'A complete rental configuration is required.' }, { status: 400 });
      const [price, inventory] = await Promise.all([getTextVerifiedRentalPrice(requestData), getTextVerifiedRentalInventory(requestData)]);
      return NextResponse.json({ basePrice: price.basePrice, displayPrice: applyMarkup(price.basePrice), availableQuantity: inventory });
    }

    const rentalId = searchParams.get('rentalId');
    if (rentalId) {
      const rental = await getRental(rentalId);
      if (!rental || rental.userId !== user.id) return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
      if (searchParams.get('action') === 'codes') {
        if (rental.provider !== 'textverified') return NextResponse.json({ error: 'This legacy rental is no longer connected to an active provider.' }, { status: 410 });
        return NextResponse.json({ rental, codes: await getTextVerifiedRentalMessages(rental.providerRentalId) });
      }
      return NextResponse.json({ rental });
    }

    return NextResponse.json({ rentals: await getUserRentals(user.id) });
  } catch (error) {
    return errorResponse(error, 'Failed to fetch rentals.');
  }
}

export async function POST(request: NextRequest) {
  let purchaseLockKey: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    if (!isTextVerifiedConfigured()) return NextResponse.json({ error: 'Text Verified is not configured.' }, { status: 503 });

    if (request.nextUrl.searchParams.get('action') === 'wake') {
      const rentalId = request.nextUrl.searchParams.get('rentalId');
      if (!rentalId) return NextResponse.json({ error: 'Rental ID is required.' }, { status: 400 });
      const rental = await getRental(rentalId);
      if (!rental || rental.userId !== user.id) return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
      if (rental.provider !== 'textverified') return NextResponse.json({ error: 'This legacy rental is no longer connected to an active provider.' }, { status: 410 });
      if (rental.status !== 'active') return NextResponse.json({ error: 'Only active rentals can be woken.' }, { status: 400 });

      const allowed = await consumeRateLimit({ scope: 'rental-wake', key: requestRateLimitKey(request, user.id), limit: 20, windowSeconds: 10 * 60 });
      if (!allowed) return NextResponse.json({ error: 'Too many wake requests. Please try again later.' }, { status: 429 });
      await wakeTextVerifiedRental(rental.providerRentalId);
      return NextResponse.json({ success: true });
    }

    const allowed = await consumeRateLimit({ scope: 'rental-order', key: requestRateLimitKey(request, user.id), limit: 5, windowSeconds: 30 * 60 });
    if (!allowed) return NextResponse.json({ error: 'Too many rental requests. Please try again later.' }, { status: 429 });
    const locked = await acquireRequestLock({ scope: 'paid-purchase', key: user.id });
    if (!locked) return NextResponse.json({ error: 'A purchase is already being processed for this account. Please wait a moment.' }, { status: 409 });
    purchaseLockKey = user.id;

    const rentalRequest = parseRentalRequest(await request.json());
    const options = await getTextVerifiedRentalOptions();
    if (rentalRequest.serviceScope === 'specific' && !options.services.some((service) => service.toLowerCase() === rentalRequest.serviceName.toLowerCase())) throw new Error('That service is not currently available for Text Verified rentals.');
    if (rentalRequest.areaCodeSelectOption?.[0] && !options.areaCodes.some((areaCode) => areaCode.areaCode === rentalRequest.areaCodeSelectOption?.[0])) throw new Error('That area code is not currently available for Text Verified rentals.');

    const dbUserPrecheck = await getUserById(user.id);
    if (!dbUserPrecheck || Number(dbUserPrecheck.balanceCents) <= 0) throw new Error('Insufficient balance. Please add funds to your wallet.');

    const quote = await getTextVerifiedRentalPrice(rentalRequest);
    const cost = applyMarkup(quote.basePrice);
    const result = await orderTextVerifiedRental(rentalRequest);
    const durationOption = getDurationOption(rentalRequest.duration)!;
    const startedAt = result.createdAt || new Date().toISOString();
    const expiresAt = result.endsAt || new Date(new Date(startedAt).getTime() + durationOption.days * 24 * 60 * 60 * 1000).toISOString();
    const rentalId = generateRentalId();

    try {
      await createRentalWithDebit({
        id: rentalId, userId: user.id, phoneNumber: result.number, country: 'US', service: rentalRequest.serviceName,
        status: result.backordered ? 'pending' : 'active', plan: rentalRequest.duration, cost, provider: 'textverified', providerRentalId: result.id,
        serviceScope: rentalRequest.serviceScope, isRenewable: rentalRequest.isRenewable, numberType: rentalRequest.numberType,
        capability: rentalRequest.capability, alwaysOn: rentalRequest.alwaysOn, areaCodes: rentalRequest.areaCodeSelectOption || [], billingCycleId: result.billingCycleId,
        startedAt, expiresAt, renewedAt: null,
      });
    } catch (error) {
      try {
        await refundTextVerifiedRental(result.id, result.billingCycleId !== null);
      } catch (refundError) {
        console.error('DEV_RENTAL_001: Provider rental cleanup failed after local debit failure.', refundError instanceof Error ? refundError.message : 'unknown error');
      }
      throw error;
    }

    return NextResponse.json({ success: true, rental: { id: rentalId, phoneNumber: result.number, country: 'US', service: rentalRequest.serviceName, status: result.backordered ? 'pending' : 'active', plan: rentalRequest.duration, cost, expiresAt } }, { status: result.backordered ? 202 : 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to order rental number.');
  } finally {
    if (purchaseLockKey) await releaseRequestLock({ scope: 'paid-purchase', key: purchaseLockKey });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const rentalId = request.nextUrl.searchParams.get('rentalId');
    if (!rentalId) return NextResponse.json({ error: 'Rental ID is required.' }, { status: 400 });
    const rental = await getRental(rentalId);
    if (!rental || rental.userId !== user.id) return NextResponse.json({ error: 'Rental not found.' }, { status: 404 });
    if (rental.provider !== 'textverified') return NextResponse.json({ error: 'This legacy rental is no longer connected to an active provider.' }, { status: 410 });

    await refundTextVerifiedRental(rental.providerRentalId, rental.isRenewable);
    await updateRental(rentalId, { status: 'cancelled' });
    return NextResponse.json({ success: true, message: 'Rental cancelled successfully.' });
  } catch (error) {
    return errorResponse(error, 'Failed to cancel rental.');
  }
}
