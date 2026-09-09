import { NextResponse } from 'next/server';
import { getServices, getCountries } from '@/lib/smspool';
import { getTextVerifiedServiceNames, isTextVerifiedConfigured } from '@/lib/textverified';

export async function GET() {
  try {
    // Fetch both at the same time for maximum speed
    const [services, countries, textVerifiedServices] = await Promise.all([
      getServices(),
      getCountries(),
      isTextVerifiedConfigured()
        ? getTextVerifiedServiceNames().catch(() => [])
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      services,
      countries,
      providers: {
        smspool: { name: 'SMSPool', configured: Boolean(process.env.SMSPOOL_API_KEY) },
        textverified: {
          name: 'Text Verified',
          configured: isTextVerifiedConfigured(),
          countries: ['US'],
          services: textVerifiedServices,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load services" }, 
      { status: 500 }
    );
  }
}
