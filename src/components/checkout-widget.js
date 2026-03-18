/*
 * Embedded Checkout Wrapper - Frontend Web Component
 * 
 * A framework-agnostic web component that provides a secure, fully embedded checkout experience.
 * It uses CSS variables for easy theming to match any sales funnel design.
 * 
 * Version: 1.0.4+sync-final (2026-03-18T00:35:00Z)
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
        console.log("Widget connected. Initializing Stripe checkout...");
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
        const customerEmail = this.getAttribute('customer-email') || '';
        const customerName = this.getAttribute('customer-name') || '';

        if (!publishableKey || !backendUrl) {
            this.showError('Missing stripe-key or backend-url.');
            return;
        }

        try {
            this.stripe = window.Stripe(publishableKey);
            const response = await fetch(`${backendUrl}/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order: { items: [{ id: 'core_product' }], price: amount, currency: 'gbp' },
                    customer: { name: customerName, email: customerEmail },
                    metadata: { funnel_source: window.location.hostname, affiliate_id: this.getAttribute('affiliate-id') || 'none' }
                })
            });

            const data = await response.json();
            if (!response.ok || !data.clientSecret) throw new Error(data.error || 'Failed to initialize payment.');

            this.clientSecret = data.clientSecret;
            const appearance = { theme: 'stripe', variables: { colorPrimary: '#2563eb', fontFamily: 'system-ui, sans-serif' } };
            this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
            const paymentElement = this.elements.create('payment', { layout: 'tabs' });
            const paymentContainer = this.shadowRoot.getElementById('payment-element');
            
            const loadTimeout = setTimeout(() => {
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                if (skeleton) {
                    console.error('Stripe load timeout');
                    this.showError('Payment fields are taking longer than expected to load.');
                }
            }, 10000);

            paymentElement.on('ready', () => {
                console.log('Stripe Element Ready Event Fired');
                clearTimeout(loadTimeout);
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                if (skeleton) skeleton.remove();
                if (paymentContainer) paymentContainer.style.minHeight = 'auto';
                this.updateSubmitButtonState();
            });

            paymentElement.on('change', (event) => {
                if (event.error) this.showError(event.error.message);
                else {
                    const errorContainer = this.shadowRoot.getElementById('error-message');
                    if (errorContainer) errorContainer.style.display = 'none';
                }
            });

            paymentElement.on('loaderror', (event) => {
                clearTimeout(loadTimeout);
                console.error('Stripe Load Error:', event.error);
                this.showError(event.error.message || 'Failed to load.');
            });

            setTimeout(() => {
                console.log('Mounting Payment Element');
                paymentElement.mount(paymentContainer);
            }, 0);

            this.setupFormListeners();
            const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
            if (termsCheckbox) termsCheckbox.addEventListener('change', () => this.updateSubmitButtonState());
            this.updateSubmitButtonState();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(error.message);
        }
    }

    setupFormListeners() {
        const form = this.shadowRoot.getElementById('payment-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
            if (!this.stripe || !this.elements || (termsCheckbox && !termsCheckbox.checked)) return;
            this.setLoading(true);
            const { error } = await this.stripe.confirmPayment({ elements: this.elements, redirect: 'if_required' });
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
        const spinner = this.shadowRoot.getElementById('spinner');
        const buttonText = this.shadowRoot.getElementById('button-text');
        if (isLoading) {
            if (spinner) spinner.classList.remove('hidden');
            if (buttonText) buttonText.textContent = 'Processing...';
        } else {
            if (spinner) spinner.classList.add('hidden');
            if (buttonText) buttonText.textContent = 'Pay Now';
        }
    }

    updateSubmitButtonState() {
        const submitBtn = this.shadowRoot.getElementById('submit-btn');
        const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
        const isReady = !this.isLoading && this.elements !== null && (termsCheckbox ? termsCheckbox.checked : true);
        if (submitBtn) submitBtn.disabled = !isReady;
    }

    showError(message) {
        const errorContainer = this.shadowRoot.getElementById('error-message');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    showSuccess() {
        const form = this.shadowRoot.getElementById('payment-form');
        const successMessage = this.shadowRoot.getElementById('success-message');
        if (form) form.style.display = 'none';
        if (successMessage) successMessage.style.display = 'flex';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --checkout-primary-color: #2563eb;
                    --checkout-bg: #ffffff;
                    --checkout-border-radius: 8px;
                    --checkout-error-color: #ef4444;
                    --checkout-success-color: #10b981;
                    display: block; font-family: system-ui, sans-serif; width: 100%;
                }
                .checkout-container { background-color: var(--checkout-bg); padding: 24px; border-radius: var(--checkout-border-radius); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                #payment-form { display: flex; flex-direction: column; gap: 24px; }
                #payment-element { min-height: 200px; display: block; border-radius: 4px; overflow: visible; }
                .skeleton { width: 100%; height: 200px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: loading-skeleton 1.5s infinite; border-radius: 6px; }
                @keyframes loading-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                button { background-color: var(--checkout-primary-color); color: #fff; border: none; border-radius: 6px; padding: 14px 16px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s ease; display: flex; justify-content: center; align-items: center; gap: 12px; }
                button:hover:not(:disabled) { opacity: 0.9; }
                button:disabled { opacity: 0.6; cursor: not-allowed; }
                .spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .hidden { display: none !important; }
                #error-message { color: var(--checkout-error-color); font-size: 14px; background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; display: none; }
                #success-message { display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; }
                .success-icon { width: 64px; height: 64px; background-color: #ecfdf5; color: var(--checkout-success-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 20px; }
                .terms-container { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
                .terms-container input { width: 18px; height: 18px; accent-color: var(--checkout-primary-color); }
                .terms-text { font-size: 14px; color: #4b5563; }
                .terms-text a { color: var(--checkout-primary-color); text-decoration: underline; }
                .secured-by { text-align: center; font-size: 12px; color: #6b7280; margin-top: 12px; }
            </style>
            <div class="checkout-container">
                <form id="payment-form">
                    <div id="payment-element"><div class="skeleton"></div></div>
                    <div id="error-message"></div>
                    <label class="terms-container">
                        <input type="checkbox" id="terms-checkbox">
                        <span class="terms-text">I agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy</a>.</span>
                    </label>
                    <button id="submit-btn" type="submit" disabled>
                        <div id="spinner" class="spinner hidden"></div>
                        <span id="button-text">Pay Now</span>
                    </button>
                    <div class="secured-by">Secured by Stripe</div>
                </form>
                <div id="success-message">
                    <div class="success-icon">✓</div>
                    <h3>Success!</h3>
                    <p>Thank you for your purchase.</p>
                </div>
            </div>
        `;
    }
}
customElements.define('custom-checkout-widget', CustomCheckoutWidget);
