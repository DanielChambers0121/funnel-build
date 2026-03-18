/*
 * Embedded Checkout Wrapper - Frontend Web Component
 * 
 * Version: 1.0.7+visibility-fix (2026-03-18T01:15:00Z)
 */

class CustomCheckoutWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.stripe = null;
        this.elements = null;
        this.clientSecret = null;
        this.isLoading = false;
        this.isMounted = false;
    }

    connectedCallback() {
        this.render();
        this.loadStripeScript().then(() => {
            this.initializeCheckout();
        }).catch(err => {
            console.error('Stripe script load failed:', err);
            this.showError('Payment system failed to load.');
        });
    }

    async loadStripeScript() {
        if (window.Stripe) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeCheckout() {
        const publishableKey = this.getAttribute('stripe-key');
        const backendUrl = this.getAttribute('backend-url');
        const amount = parseInt(this.getAttribute('amount') || '5000', 10);

        if (!publishableKey || !backendUrl) {
            this.showError('Configuration error: missing Stripe keys.');
            return;
        }

        try {
            console.log('[Stripe Fix] Initializing with key:', publishableKey.substring(0, 10) + '...');
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
                    metadata: { funnel_source: window.location.hostname }
                })
            });

            const data = await response.json();
            if (!response.ok || !data.clientSecret) throw new Error(data.error || 'Failed to create payment session.');

            this.clientSecret = data.clientSecret;
            console.log('[Stripe Fix] Client secret received.');

            const appearance = { 
                theme: 'stripe',
                variables: { colorPrimary: '#2563eb' }
            };
            
            this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
            const paymentElement = this.elements.create('payment', { layout: 'tabs' });
            const container = this.shadowRoot.getElementById('payment-element');

            paymentElement.on('ready', () => {
                console.log('[Stripe Fix] Payment Element READY.');
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                if (skeleton) skeleton.remove();
                this.updateSubmitButtonState();
            });

            paymentElement.on('change', (event) => {
                if (event.error) this.showError(event.error.message);
                else {
                    const err = this.shadowRoot.getElementById('error-message');
                    if (err) err.style.display = 'none';
                }
            });

            // Visibility-aware mounting
            const mountWhenVisible = () => {
                if (this.isMounted) return;
                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    console.log('[Stripe Fix] Container visible. Mounting now...');
                    paymentElement.mount(container);
                    this.isMounted = true;
                } else {
                    console.log('[Stripe Fix] Container not visible yet. Waiting...');
                    requestAnimationFrame(mountWhenVisible);
                }
            };

            // Use IntersectionObserver or RAF loop
            if (window.IntersectionObserver) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        mountWhenVisible();
                        observer.disconnect();
                    }
                }, { threshold: 0.1 });
                observer.observe(container);
            } else {
                requestAnimationFrame(mountWhenVisible);
            }

            this.setupFormListeners();
            const terms = this.shadowRoot.getElementById('terms-checkbox');
            if (terms) terms.addEventListener('change', () => this.updateSubmitButtonState());

        } catch (error) {
            console.error('[Stripe Fix] Error:', error);
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
        const ready = !this.isLoading && this.elements && (terms ? terms.checked : true);
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
                :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                .container { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
                #payment-form { display: flex; flex-direction: column; gap: 24px; min-width: 320px; }
                #payment-element { min-height: 250px; width: 100%; border-radius: 4px; transition: all 0.3s ease; }
                .skeleton { width: 100%; height: 250px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 8px; }
                @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                button { background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 16px; font-weight: 600; font-size: 16px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 12px; transition: background 0.2s; }
                button:hover:not(:disabled) { background: #1d4ed8; }
                button:disabled { opacity: 0.5; cursor: not-allowed; }
                .spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hidden { display: none; }
                #error-message { color: #dc2626; background: #fef2f2; padding: 14px; border-radius: 8px; border: 1px solid #fecaca; display: none; font-size: 14px; line-height: 1.5; }
                #success-message { display: none; flex-direction: column; align-items: center; padding: 48px 24px; text-align: center; }
                .terms-container { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 14px; color: #4b5563; line-height: 1.4; user-select: none; }
                .terms-container input { width: 20px; height: 20px; margin: 0; accent-color: #2563eb; flex-shrink: 0; }
                .terms-container span a { color: #2563eb; text-decoration: underline; }
            </style>
            <div class="container">
                <form id="payment-form">
                    <div id="payment-element"><div class="skeleton"></div></div>
                    <div id="error-message"></div>
                    <label class="terms-container">
                        <input type="checkbox" id="terms-checkbox">
                        <span>I confirm that I have read and agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
                    </label>
                    <button id="submit-btn" type="submit" disabled>
                        <div id="spinner" class="spinner hidden"></div>
                        <span id="button-text">Pay Now</span>
                    </button>
                    <div style=\"text-align:center;font-size:12px;color:#9ca3af;margin-top:12px;font-weight:500;\">🔒 Secured by Stripe</div>
                </form>
                <div id="success-message">
                    <div style=\"width:64px;height:64px;background:#ecfdf5;color:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;\">✓</div>
                    <h3 style=\"margin:0 0 8px 0;color:#111827;\">Payment Successful!</h3>
                    <p style=\"margin:0;color:#4b5563;\">Thank you for your order. A confirmation email has been sent.</p>
                </div>
            </div>
        `;
    }
}
customElements.define('custom-checkout-widget', CustomCheckoutWidget);
