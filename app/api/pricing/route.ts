import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/smspool';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const service = searchParams.get('service');

  if (!country || !service) {
    return NextResponse.json({ error: 'Country and service are required.' }, { status: 400 });
  }

  try {
    const { basePrice, displayPrice, successRate } = await getPrice(country, service);
    return NextResponse.json({ basePrice, displayPrice, successRate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pricing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}