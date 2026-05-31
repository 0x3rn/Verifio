import { NextRequest, NextResponse } from 'next/server';

// Resolve country from IP address using ipapi.co (free, no API key required for non-commercial)
// Returns { country: string } where country is a country code like "US", "GB", etc.
export async function GET(request: NextRequest) {
  try {
    // Try to get IP from forwarded headers (Vercel, Cloudflare, etc.) or fall back to the request IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || '';

    if (!ip) {
      return NextResponse.json({ country: null }, { status: 200 });
    }

    // Use ipapi.co — free tier: 1000 req/day per IP, no API key
    // Falls back gracefully if rate-limited
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ country: null }, { status: 200 });
    }

    const data = await res.json();
    const country = data?.country_code || null;

    return NextResponse.json({ country }, { status: 200 });
  } catch {
    return NextResponse.json({ country: null }, { status: 200 });
  }
}