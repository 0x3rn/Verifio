import { NextResponse } from 'next/server';
import { getServices, getCountries } from '@/lib/smspool';

export async function GET() {
  try {
    // Fetch both at the same time for maximum speed
    const [services, countries] = await Promise.all([
      getServices(),
      getCountries()
    ]);

    return NextResponse.json({ services, countries });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load services" }, 
      { status: 500 }
    );
  }
}