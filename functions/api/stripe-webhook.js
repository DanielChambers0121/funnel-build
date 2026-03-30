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
            const amountPaid = paymentIntent.amount; // In pence

            if (customerEmail) {
                console.log(`[Webhook] Payment Succeeded for: ${customerEmail} (£${(amountPaid / 100).toFixed(2)})`);
                
                // Initialize Supabase with the Service Role Key for backend access.
                const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ 
                        paid: true,
                        stripe_payment_id: paymentIntent.id,
                        amount_paid: amountPaid
                    })
                    .eq('email', customerEmail);

                if (updateError) {
                    console.error('[Webhook] Database update failed:', updateError);
                    return new Response('Database update error.', { status: 500 });
                }

                console.log(`[Webhook] Successfully updated status for ${customerEmail}`);

                // Step 2: Send the 'Perfect Welcome Email'
                if (env.RESEND_API_KEY) {
                    try {
                        const emailRes = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${env.RESEND_API_KEY}`
                            },
                            body: JSON.stringify({
                                from: "D'Solutions <onboarding@d-solutions0121.co.uk>",
                                to: customerEmail,
                                subject: "Welcome to the Ecosystem – Your Phase 1 Blueprint Inside",
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
                                        <h1 style="color: #00d2ff; font-size: 24px;">Welcome to the Ecosystem.</h1>
                                        <p>Phase 1 is officially underway. Your payment has been securely processed, and we've attached your onboarding details below.</p>
                                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="margin-top: 0;">What's Next?</h3>
                                            <p>To access your full resource library, including the strategy PDFs we discussed, please head over to your custom portal:</p>
                                            <a href="https://portal.d-solutions0121.co.uk" style="display: inline-block; background: #00d2ff; color: #000; padding: 12px 24px; border-radius: 100px; font-weight: 700; text-decoration: none;">Access the Vault</a>
                                        </div>
                                        <p>If you have any questions, simply reply to this email. We're here to help you scale.</p>
                                        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">&copy; ${new Date().getFullYear()} D'Solutions. All rights reserved.</p>
                                    </div>
                                `
                            })
                        });

                        if (!emailRes.ok) {
                            const errData = await emailRes.json();
                            console.error('[Webhook] Welcome email failed:', errData);
                        } else {
                            console.log(`[Webhook] Welcome email sent successfully to ${customerEmail}`);
                        }
                    } catch (emailErr) {
                        console.error('[Webhook] Email delivery service error:', emailErr);
                    }
                } else {
                    console.warn('[Webhook] RESEND_API_KEY missing - skipping welcome email.');
                }
            }
        }

        return new Response('Webhook processed successfully.', { status: 200 });

    } catch (err) {
        console.error(`[Webhook Error] Verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
}
