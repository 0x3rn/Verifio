import { NextResponse } from 'next/server';
import { applyMarkup, getCountries, getPrice, getServices } from '@/lib/smspool';
import { getTextVerifiedPrice } from '@/lib/textverified';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const service = searchParams.get('service');
  const provider = searchParams.get('provider') || 'smspool';

  if (!country || !service) {
    return NextResponse.json({ error: 'Country and service are required.' }, { status: 400 });
  }

  try {
    if (provider === 'textverified') {
      const [services, countries] = await Promise.all([getServices(), getCountries()]);
      const serviceName = services.find((item) => String(item.ID) === service)?.name || service;
      const countryCode = countries.find((item) => String(item.ID) === country)?.short_name || country;
      if (countryCode.toUpperCase() !== 'US') {
        return NextResponse.json({ error: 'Text Verified currently supports US numbers only.' }, { status: 400 });
      }

      const { basePrice } = await getTextVerifiedPrice(serviceName);
      return NextResponse.json({
        basePrice,
        displayPrice: applyMarkup(basePrice),
      });
    }

    if (provider !== 'smspool') {
      return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
    }

    const { basePrice, displayPrice, successRate } = await getPrice(country, service);
    return NextResponse.json({ basePrice, displayPrice, successRate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pricing.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
