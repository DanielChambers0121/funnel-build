/*
 * Embedded Checkout Wrapper - Frontend Web Component
 * 
 * Version: 1.0.6+shadow-dom-fix (2026-03-18T01:05:00Z)
 */

class CustomCheckoutWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.stripe = null;
        this.elements = null;
        this.clientSecret = null;
        this.isLoading = false;
    }

    connectedCallback() {
        this.render();
        this.loadStripeScript().then(() => {
            this.initializeCheckout();
        }).catch(err => {
            this.showError('Failed to load payment system.');
            console.error(err);
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
            this.showError('Configuration error: missing keys.');
            return;
        }

        try {
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
            if (!response.ok || !data.clientSecret) throw new Error(data.error || 'Failed to initialize payment.');

            this.clientSecret = data.clientSecret;
            const appearance = { theme: 'stripe', variables: { colorPrimary: '#2563eb' } };
            this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
            
            const paymentElement = this.elements.create('payment', { layout: 'tabs' });
            const container = this.shadowRoot.getElementById('payment-element');

            paymentElement.on('ready', () => {
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

            requestAnimationFrame(() => {
                if (container) {
                    paymentElement.mount(container);
                }
            });

            this.setupFormListeners();
            const terms = this.shadowRoot.getElementById('terms-checkbox');
            if (terms) terms.addEventListener('change', () => this.updateSubmitButtonState());

        } catch (error) {
            console.error('Stripe Init Error:', error);
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
                :host { display: block; font-family: system-ui, sans-serif; }
                .container { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                #payment-form { display: flex; flex-direction: column; gap: 20px; }
                #payment-element { min-height: 200px; border-radius: 4px; }
                .skeleton { width: 100%; height: 200px; background: #f3f4f6; animation: pulse 1.5s infinite; border-radius: 6px; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                button { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 14px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; }
                button:disabled { opacity: 0.6; cursor: not-allowed; }
                .spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hidden { display: none; }
                #error-message { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 6px; display: none; font-size: 14px; }
                #success-message { display: none; flex-direction: column; align-items: center; padding: 40px; }
                .terms-container { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 14px; color: #4b5563; }
                .terms-container input { width: 18px; height: 18px; margin: 0; }
            </style>
            <div class="container">
                <form id="payment-form">
                    <div id="payment-element"><div class="skeleton"></div></div>
                    <div id="error-message"></div>
                    <label class="terms-container">
                        <input type="checkbox" id="terms-checkbox">
                        <span>I agree to the <a href="/terms" target="_blank">Terms</a>.</span>
                    </label>
                    <button id="submit-btn" type="submit" disabled>
                        <div id="spinner" class="spinner hidden"></div>
                        <span id="button-text">Pay Now</span>
                    </button>
                    <div style="text-align:center;font-size:12px;color:#6b7280;margin-top:10px;">Secured by Stripe</div>
                </form>
                <div id="success-message">
                    <div style="width:48px;height:48px;background:#ecfdf5;color:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;">✓</div>
                    <h3>Success!</h3>
                    <p>Order confirmed.</p>
                </div>
            </div>
        `;
    }
}
customElements.define('custom-checkout-widget', CustomCheckoutWidget);
