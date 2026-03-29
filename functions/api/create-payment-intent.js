import Stripe from 'stripe';

const PRICE_MAP = {
    'audit': 25000,   // £250.00
    'build': 149900,  // £1499.00
    'dfy': 499900     // £4999.00
};

const PROD_ORIGIN = 'https://d-solutions0121.co.uk';

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin');
    const allowedOrigin = (origin === 'http://localhost:8788' || origin === PROD_ORIGIN) ? origin : PROD_ORIGIN;
    
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
}

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!env.STRIPE_SECRET_KEY) {
        console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is missing.');
        return new Response(
            JSON.stringify({ error: 'Payment system configuration error: Secret key missing.' }),
            { status: 500, headers: getCorsHeaders(request) }
        );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
    });

    try {
        const body = await request.json();
        const { tierId, customer, metadata } = body;

        if (!tierId || !customer?.email) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: tierId or customer.email.' }),
                { status: 400, headers: getCorsHeaders(request) }
            );
        }

        const amount = PRICE_MAP[tierId];
        if (!amount) {
            return new Response(
                JSON.stringify({ error: `Invalid plan selected: ${tierId}` }),
                { status: 400, headers: getCorsHeaders(request) }
            );
        }

        // Create a PaymentIntent with the server-validated amount
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            payment_method_types: ['card'],
            currency: 'gbp',
            receipt_email: customer.email,
            metadata: {
                customer_name: customer.name || '',
                customer_email: customer.email,
                funnel_source: metadata?.funnel_source || 'unknown',
                affiliate_id: metadata?.affiliate_id || 'none',
                tier_id: tierId
            },
        });

        console.log('Successfully created PaymentIntent:', paymentIntent.id);

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            {
                status: 200,
                headers: getCorsHeaders(request),
            }
        );

    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to create payment intent.' }),
            { 
                status: 500, 
                headers: getCorsHeaders(request)
            }
        );
    }
}

// Handle CORS preflight requests
export async function onRequestOptions(context) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(context.request),
    });
}
