/*
 * Embedded Checkout Wrapper - Frontend Web Component
 * 
 * Version: 1.0.8+shadow-dom-mount-fix (2026-03-18T02:15:00Z)
 */

class CustomCheckoutWidget extends HTMLElement {
    static get observedAttributes() {
        return ['amount', 'customer-email', 'customer-name'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.clientSecret = null;
        this.isLoading = false;
        this.isMounted = false;
        this.initPromise = null;
    }

    connectedCallback() {
        this.render();
        this.initPromise = this.loadStripeScript().then(() => {
            return this.initializeCheckout();
        }).catch(err => {
            console.error('[Stripe Fix] Script load failed:', err);
            this.showError('Payment system failed to load.');
        });
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal && this.isMounted) {
            console.log(`[Stripe Fix] Attribute ${name} changed. Re-initializing...`);
            // For significant changes like amount, we might need a fresh intent.
            // For now, we'll just log it. A full re-init would require unmounting.
        }
    }

    async loadStripeScript() {
        if (window.Stripe) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeCheckout() {
        const publishableKey = this.getAttribute('stripe-key');
        const backendUrl = this.getAttribute('backend-url');
        const amount = parseInt(this.getAttribute('amount') || '25000', 10); // Default to 25000 (£250)

        if (!publishableKey || !backendUrl) {
            this.showError('Configuration error: missing Stripe keys.');
            return;
        }

        try {
            console.log('[Stripe Fix] Fetching payment intent for amount:', amount);
            this.stripe = window.Stripe(publishableKey);
            
            const response = await fetch(`${backendUrl}/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order: { items: [{ id: 'core_product' }], price: amount, currency: 'gbp' },
                    customer: { 
                        name: this.getAttribute('customer-name') || '', 
                        email: this.getAttribute('customer-email') || '' 
                    },
                    metadata: { 
                        funnel_source: window.location.hostname,
                        affiliate_id: this.getAttribute('affiliate-id') || 'none'
                    }
                })
            });

            const data = await response.json();
            if (!response.ok || !data.clientSecret) throw new Error(data.error || 'Failed to create payment session.');

            this.clientSecret = data.clientSecret;
            console.log('[Stripe Fix] Client secret received.');

            const appearance = { 
                theme: 'stripe',
                variables: { 
                    colorPrimary: '#00d2ff',
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    borderRadius: '8px'
                }
            };
            
            this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
            this.paymentElement = this.elements.create('payment', { layout: 'tabs' });
            
            const container = this.shadowRoot.getElementById('payment-element');

            this.paymentElement.on('ready', () => {
                console.log('[Stripe Fix] Payment Element READY Event Fired.');
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                if (skeleton) skeleton.remove();
                
                // Force container to auto height once ready
                container.style.height = 'auto';
                this.updateSubmitButtonState();
                
                // Final resize nudge
                setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
            });

            this.paymentElement.on('change', (event) => {
                if (event.error) this.showError(event.error.message);
                else {
                    const err = this.shadowRoot.getElementById('error-message');
                    if (err) err.style.display = 'none';
                }
            });

            // Improved Mount Cycle
            const performMount = () => {
                if (this.isMounted) return;
                
                console.log('[Stripe Fix] Mounting Payment Element to Shadow DOM...');
                
                // 1. Ensure container has an explicit minimum height to avoid zero-size collapse
                container.style.minHeight = '300px'; 
                
                // 2. Remove skeleton manually just before mount to avoid collisions
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                
                // 3. Mount
                this.paymentElement.mount(container);
                this.isMounted = true;

                // 4. Force Stripe to recalculate by triggering various resize signals
                requestAnimationFrame(() => {
                    window.dispatchEvent(new Event('resize'));
                    // Also dispatch a custom event that might wake up internal listeners
                    this.dispatchEvent(new CustomEvent('stripe-mounted', { bubbles: true }));
                });
            };

            // Visibility Check
            if (window.IntersectionObserver) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        performMount();
                        observer.disconnect();
                    }
                }, { threshold: 0.1 });
                observer.observe(container);
            } else {
                performMount();
            }

            this.setupFormListeners();
            const terms = this.shadowRoot.getElementById('terms-checkbox');
            if (terms) terms.addEventListener('change', () => this.updateSubmitButtonState());

        } catch (error) {
            console.error('[Stripe Fix] Initialization Error:', error);
            this.showError(error.message);
        }
    }

    setupFormListeners() {
        const form = this.shadowRoot.getElementById('payment-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const terms = this.shadowRoot.getElementById('terms-checkbox');
            if (!this.stripe || !this.elements || (terms && !terms.checked)) return;
            
            this.setLoading(true);
            const { error } = await this.stripe.confirmPayment({ 
                elements: this.elements, 
                confirmParams: { return_url: window.location.href },
                redirect: 'if_required' 
            });

            if (error) {
                this.showError(error.message);
                this.setLoading(false);
            } else {
                this.showSuccess();
                this.dispatchEvent(new CustomEvent('payment-success', { bubbles: true, composed: true }));
            }
        });
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.updateSubmitButtonState();
        const btn = this.shadowRoot.getElementById('button-text');
        const spinner = this.shadowRoot.getElementById('spinner');
        if (btn) btn.textContent = isLoading ? 'Processing...' : 'Pay Now';
        if (spinner) {
            if (isLoading) spinner.classList.remove('hidden');
            else spinner.classList.add('hidden');
        }
    }

    updateSubmitButtonState() {
        const btn = this.shadowRoot.getElementById('submit-btn');
        const terms = this.shadowRoot.getElementById('terms-checkbox');
        const ready = !this.isLoading && this.isMounted && (terms ? terms.checked : true);
        if (btn) btn.disabled = !ready;
    }

    showError(msg) {
        const err = this.shadowRoot.getElementById('error-message');
        if (err) {
            err.textContent = msg;
            err.style.display = 'block';
        }
    }

    showSuccess() {
        const form = this.shadowRoot.getElementById('payment-form');
        const success = this.shadowRoot.getElementById('success-message');
        if (form) form.style.display = 'none';
        if (success) success.style.display = 'flex';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { 
                    display: block; 
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                }
                .container { 
                    background: #fff; 
                    padding: 32px; 
                    border-radius: 12px; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
                    border: 1px solid #e5e7eb;
                    color: #1f2937;
                }
                #payment-form { display: flex; flex-direction: column; gap: 24px; }
                #payment-element { 
                    width: 100%; 
                    min-height: 300px; 
                    transition: height 0.3s ease;
                    overflow: visible;
                }
                .skeleton { 
                    width: 100%; 
                    height: 300px; 
                    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); 
                    background-size: 200% 100%; 
                    animation: loading 1.5s infinite; 
                    border-radius: 8px; 
                }
                @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                #submit-btn { 
                    background: #00d2ff; 
                    color: #000; 
                    border: none; 
                    border-radius: 100px; 
                    padding: 18px; 
                    font-weight: 700; 
                    font-size: 18px; 
                    cursor: pointer; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    gap: 12px; 
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
                }
                #submit-btn:hover:not(:disabled) { 
                    background: #00b4db; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4);
                }
                #submit-btn:disabled { 
                    opacity: 0.5; 
                    cursor: not-allowed; 
                    transform: none;
                    box-shadow: none;
                }
                .spinner { width: 22px; height: 22px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hidden { display: none; }
                
                #error-message { color: #dc2626; background: #fef2f2; padding: 14px; border-radius: 8px; border: 1px solid #fecaca; display: none; font-size: 14px; }
                #success-message { display: none; flex-direction: column; align-items: center; padding: 48px 24px; text-align: center; }
                
                .terms-container { 
                    display: flex; 
                    align-items: flex-start; 
                    gap: 12px; 
                    cursor: pointer; 
                    font-size: 14px; 
                    color: #6b7280; 
                    line-height: 1.5; 
                }
                .terms-container input { 
                    width: 18px; 
                    height: 18px; 
                    margin-top: 2px;
                    accent-color: #00d2ff; 
                    flex-shrink: 0; 
                }
                .terms-container a { color: #00d2ff; text-decoration: none; font-weight: 600; }
                .terms-container a:hover { text-decoration: underline; }
                .secured-by { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #9ca3af; margin-top: 12px; font-weight: 500; }
            </style>
            <div class="container">
                <form id="payment-form">
                    <div id="payment-element">
                        <div class="skeleton"></div>
                    </div>
                    <div id="error-message"></div>
                    <label class="terms-container">
                        <input type="checkbox" id="terms-checkbox">
                        <span>I confirm that I have read and agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
                    </label>
                    <button id="submit-btn" type="submit" disabled>
                        <div id="spinner" class="spinner hidden"></div>
                        <span id="button-text">Pay Now</span>
                    </button>
                    <div class="secured-by">🔒 Secured by Stripe</div>
                </form>
                <div id="success-message">
                    <div style=\"width:64px;height:64px;background:#ecfdf5;color:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;\">✓</div>
                    <h3 style=\"margin:0 0 8px 0;color:#111827;\">Payment Successful!</h3>
                    <p style=\"margin:0;color:#4b5563;\">Thank you for your order. Your onboarding blueprint is on its way.</p>
                </div>
            </div>
        `;
    }
}
if (!customElements.get('custom-checkout-widget')) {
    customElements.define('custom-checkout-widget', CustomCheckoutWidget);
}
