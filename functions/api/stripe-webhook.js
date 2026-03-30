import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { env, request } = context;

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
        return new Response('Stripe secrets not configured.', { status: 500 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
    });

    const signature = request.headers.get('stripe-signature');

    try {
        const body = await request.text();
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );

        console.log(`[Webhook] Event Received: ${event.type}`);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const customerEmail = paymentIntent.metadata.customer_email;

            if (customerEmail) {
                console.log(`[Webhook] Payment Succeeded for: ${customerEmail}`);
                
                // Initialize Supabase with the Service Role Key for backend access.
                const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ paid: true })
                    .eq('email', customerEmail);

                if (updateError) {
                    console.error('[Webhook] Database update failed:', updateError);
                    return new Response('Database update error.', { status: 500 });
                }
                
                console.log(`[Webhook] Successfully updated status for ${customerEmail}`);
            }
        }

        return new Response('Webhook processed successfully.', { status: 200 });

    } catch (err) {
        console.error(`[Webhook Error] Verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
}
