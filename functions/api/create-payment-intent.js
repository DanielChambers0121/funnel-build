import Stripe from 'stripe';

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!env.STRIPE_SECRET_KEY) {
        console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is missing.');
        return new Response(
            JSON.stringify({ error: 'Payment system configuration error.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
    });

    try {
        const body = await request.json();
        const { order, customer, metadata } = body;

        if (!order?.price || !customer?.email) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: order.price or customer.email.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: order.price,
            automatic_payment_methods: { enabled: true }, // Already in pence/cents from the widget
            currency: order.currency || 'gbp',
            receipt_email: customer.email,
            metadata: {
                customer_name: customer.name || '',
                customer_email: customer.email,
                funnel_source: metadata?.funnel_source || 'unknown',
                affiliate_id: metadata?.affiliate_id || 'none',
            },
        });

        console.log('Successfully created PaymentIntent:', paymentIntent.id);

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
        );

    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to create payment intent.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
