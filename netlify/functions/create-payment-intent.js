const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('CRITICAL: STRIPE_SECRET_KEY environment variable is missing.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Payment system configuration error.' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { order, customer, metadata } = body;

        if (!order?.price || !customer?.email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: order.price or customer.email.' })
            };
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: order.price, // Already in pence/cents from the widget
            currency: order.currency || 'gbp',
            receipt_email: customer.email,
            metadata: {
                customer_name: customer.name || '',
                customer_email: customer.email,
                funnel_source: metadata?.funnel_source || 'unknown',
                affiliate_id: metadata?.affiliate_id || 'none',
            },
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allows local dev testing
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
        };

    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Failed to create payment intent.' })
        };
    }
};
