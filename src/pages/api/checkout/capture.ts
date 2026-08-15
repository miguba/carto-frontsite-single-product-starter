import type { APIRoute } from 'astro';
import { postCommerce } from '@/lib/commerce';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderNo, provider, providerOrderId } = (await request.json()) as {
      orderNo?: string;
      provider?: 'paypal' | 'stripe';
      providerOrderId?: string;
    };
    if (
      !orderNo ||
      !providerOrderId ||
      (provider !== 'paypal' && provider !== 'stripe')
    ) {
      return json(
        { success: false, error: 'Invalid payment capture request.' },
        400,
      );
    }
    const order = await postCommerce<any>('/api/commerce/payments/capture', {
      orderNo,
      provider,
      providerOrderId,
    });
    return json({
      success: true,
      data: {
        orderNo: order.orderNo,
        paymentId: providerOrderId,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Carto payment capture failed:', error);
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to capture payment',
      },
      502,
    );
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
