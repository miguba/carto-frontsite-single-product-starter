import type { APIRoute } from 'astro';
import { postCommerce } from '@/lib/commerce';
import type { ICheckout } from '@/types/app.type';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { checkout, paymentMethod, fundingSource } = (await request.json()) as {
      checkout: ICheckout;
      paymentMethod: 'paypal' | 'stripe';
      fundingSource?: string;
    };
    const selected = checkout?.cart?.item;
    const selectedSku = selected?.sku;
    if (!selected || !selectedSku?.productSlug || !selectedSku.apiSku) {
      return json({ success: false, error: 'The selected product is invalid or stale. Please return to the store and select it again.' }, 400);
    }
    if (paymentMethod !== 'paypal' && paymentMethod !== 'stripe') {
      return json({ success: false, error: 'Unsupported payment method.' }, 400);
    }

    const address = (source: NonNullable<ICheckout['shippingInfo']>) => ({
      address1: source.fullAddress,
      address2: source.address2 || '',
      city: source.city,
      state: source.state,
      postalCode: source.zipCode,
      country: source.country,
    });
    const customer = checkout.customerInfo!;
    const order = await postCommerce<any>('/api/commerce/orders', {
      customer: {
        email: customer.email,
        phone: customer.phone || '',
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
      billingAddress: address(checkout.billingInfo!),
      billingAddressAsShippingAddress: checkout.isSameAsShippingAddress ?? true,
      shippingAddress: address(checkout.shippingInfo!),
      items: [{
        productSlug: selectedSku.productSlug,
        sku: selectedSku.apiSku,
        quantity: selected.quantity || 1,
      }],
    });
    const payment = await postCommerce<any>('/api/commerce/payments/create', {
      orderNo: order.orderNo,
      provider: paymentMethod,
      fundingSource: paymentMethod === 'paypal' ? fundingSource || 'paypal' : undefined,
    });
    return json({
      success: true,
      data: {
        orderNo: order.orderNo,
        paymentId: payment.providerOrderId,
        providerOrderId: payment.providerOrderId,
        clientSecret: payment.clientSecret,
      },
    });
  } catch (error) {
    console.error('Carto order creation failed:', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Failed to create order' }, 502);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
