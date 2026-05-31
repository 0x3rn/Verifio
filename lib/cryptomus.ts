/**
 * Cryptomus Payment Integration
 * 
 * Set these environment variables:
 *   CRYPTOMUS_API_KEY=your_api_key_here
 *   CRYPTOMUS_MERCHANT_ID=your_merchant_id_here
 * 
 * API docs: https://doc.cryptomus.com/
 */

const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || '';
const CRYPTOMUS_MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID || '';
const CRYPTOMUS_BASE_URL = 'https://api.cryptomus.com/v1';

interface CryptomusPaymentRequest {
  amount: string;       // e.g. "10.00"
  currency: string;     // "USD"
  order_id: string;     // unique order ID from your system
  url_callback?: string; // webhook URL
  url_return?: string;   // return URL after payment
  url_success?: string;  // success redirect
  lifetime?: number;     // payment lifetime in seconds (default 3600)
}

interface CryptomusPaymentResponse {
  state: number;         // 0 = success
  result: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string;
    payer_amount: string;
    payer_currency: string;
    currency: string;
    network: string;
    url: string;         // payment page URL
    expired_at: number;
    status: string;
    is_final: boolean;
    addresses: {
      currency: string;
      network: string;
      address: string;
    };
  };
}

function generateSign(data: Record<string, unknown>): string {
  const crypto = require('crypto');
  const jsonData = JSON.stringify(data);
  const base64 = Buffer.from(jsonData).toString('base64');
  return crypto.createHash('md5').update(base64 + CRYPTOMUS_API_KEY).digest('hex');
}

async function cryptomusRequest<T>(
  endpoint: string,
  body: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const sign = generateSign(body);

  const response = await fetch(`${CRYPTOMUS_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'merchant': CRYPTOMUS_MERCHANT_ID,
      'sign': sign,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cryptomus API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Create a payment invoice
 */
export async function createPayment(
  amount: number,
  orderId: string,
  currency: string = 'USD'
): Promise<CryptomusPaymentResponse> {
  const body: CryptomusPaymentRequest = {
    amount: amount.toFixed(2),
    currency,
    order_id: orderId,
    url_callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/crypto`,
    url_return: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing`,
    url_success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?success=1`,
    lifetime: 7200, // 2 hours
  };

  return cryptomusRequest<CryptomusPaymentResponse>('/payment', body as unknown as Record<string, unknown>);
}

/**
 * Get payment info by order ID
 */
export async function getPaymentInfo(orderId: string) {
  const body = { order_id: orderId };
  return cryptomusRequest<{
    state: number;
    result: {
      uuid: string;
      order_id: string;
      amount: string;
      status: string;
      payment_status: string;
    };
  }>('/payment/info', body as unknown as Record<string, unknown>);
}

/**
 * Get list of payment services (available coins/networks)
 */
export async function getPaymentServices() {
  const body = {};
  return cryptomusRequest<{
    state: number;
    result: Array<{
      network: string;
      currency: string;
      is_available: boolean;
    }>;
  }>('/payment/services', body as unknown as Record<string, unknown>);
}

/**
 * Verify webhook signature from Cryptomus
 */
export function verifyWebhookSign(body: Record<string, unknown>, receivedSign: string): boolean {
  const expectedSign = generateSign(body);
  return expectedSign === receivedSign;
}