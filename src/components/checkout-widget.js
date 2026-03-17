/*
 * Embedded Checkout Wrapper - Frontend Web Component
 * 
 * A framework-agnostic web component that provides a secure, fully embedded checkout experience.
 * It uses CSS variables for easy theming to match any sales funnel design.
 */

class CustomCheckoutWidget extends HTMLElement {
    constructor() {
        super();
        // Attach shadow DOM for styling encapsulation
        this.attachShadow({ mode: 'open' });

        // Internal state
        this.stripe = null;
        this.elements = null;
        this.clientSecret = null;
        this.isLoading = false;
    }

    connectedCallback() {
        // Render initial structure
        this.render();

        console.log("Widget connected. Initializing Stripe checkout...");

        // Load Stripe.js then initialize checkout
        this.loadStripeScript().then(() => {
            this.initializeCheckout();
        }).catch(err => {
            this.showError('Failed to load payment system. Please try again later.');
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
            this.showError('Checkout widget configuration error: missing stripe-key or backend-url.');
            return;
        }

        try {
            // 1. Initialize Stripe
            this.stripe = window.Stripe(publishableKey);

            // 2. Fetch the PaymentIntent client secret from the Netlify serverless function
            const response = await fetch(`${backendUrl}/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order: {
                        items: [{ id: 'core_product' }],
                        price: amount,
                        currency: 'gbp'
                    },
                    customer: {
                        name: customerName,
                        email: customerEmail
                    },
                    metadata: {
                        funnel_source: window.location.hostname,
                        affiliate_id: this.getAttribute('affiliate-id') || 'none'
                    }
                })
            });

            const data = await response.json();

            if (!response.ok || !data.clientSecret) {
                throw new Error(data.error || 'Failed to initialize payment.');
            }

            this.clientSecret = data.clientSecret;

            // 3. Initialize Stripe Elements
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#2563eb',
                    fontFamily: 'system-ui, sans-serif',
                }
            };

            this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
            const paymentElement = this.elements.create('payment', { layout: 'tabs' });

            // 4. Mount the Payment Element into the shadow DOM container
            const paymentContainer = this.shadowRoot.getElementById('payment-element');
            paymentContainer.innerHTML = '';
            paymentElement.mount(paymentContainer);

            paymentElement.on('ready', () => {
                console.log('Stripe Element Ready');
                const skeleton = this.shadowRoot.querySelector('.skeleton');
                if (skeleton) skeleton.remove();
                paymentContainer.style.minHeight = 'auto';
            });

            paymentElement.on('loaderror', (event) => {
                console.error('Stripe Load Error:', event.error);
                let userMessage = 'Failed to load payment fields.';
                if (event.error.type === 'invalid_request_error') {
                    userMessage = 'Stripe configuration error. Please ensure your domain is authorized and account is active.';
                }
                this.showError(userMessage);
            });

            paymentElement.on('ready', () => {
                console.log('Stripe Element Ready');
                this.shadowRoot.getElementById('payment-element').style.minHeight = 'auto';
            });

            paymentElement.on('loaderror', (event) => {
                console.error('Stripe Load Error:', event.error);
                this.showError('Failed to load payment fields. Check your Stripe Dashboard settings.');
            });

            // Setup form submission
            this.setupFormListeners();
        const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
        termsCheckbox.addEventListener('change', () => this.updateSubmitButtonState());

            // Initial button state check
            this.updateSubmitButtonState();

        } catch (error) {
            console.error('Checkout initialization error:', error);
            this.showError(error.message);
        }
    }

    setupFormListeners() {
        const form = this.shadowRoot.getElementById('payment-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
            if (!this.stripe || !this.elements || !termsCheckbox.checked) return;
            this.setLoading(true);

            // Confirm the payment using Stripe Elements
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                // redirect: 'if_required' keeps the user on the same page for card payments
                redirect: 'if_required',
            });

            if (error) {
                // Show inline error (e.g., card declined, insufficient funds)
                this.showError(error.message);
                this.setLoading(false);
            } else {
                // Payment succeeded
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
            spinner.classList.remove('hidden');
            buttonText.textContent = 'Processing...';
        } else {
            spinner.classList.add('hidden');
            buttonText.textContent = 'Pay Now';
        }
    }

    updateSubmitButtonState() {
        const submitBtn = this.shadowRoot.getElementById('submit-btn');
        const termsCheckbox = this.shadowRoot.getElementById('terms-checkbox');
        
        // Button is only enabled if:
        // 1. We're not currently loading/processing
        // 2. Stripe Elements are initialized (this.elements is not null)
        // 3. The terms checkbox is checked
        const isReady = !this.isLoading && this.elements !== null && termsCheckbox.checked;
        
        if (submitBtn) {
            submitBtn.disabled = !isReady;
        }
    }
    }

    showError(message) {
        const errorContainer = this.shadowRoot.getElementById('error-message');
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    showSuccess() {
        const form = this.shadowRoot.getElementById('payment-form');
        const successMessage = this.shadowRoot.getElementById('success-message');

        form.style.display = 'none';
        successMessage.style.display = 'flex';
    }

    render() {
        // Minimalist, high-end base styles that can be overridden via CSS custom properties
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    /* Public CSS Variables for Theming */
                    --checkout-primary-color: #2563eb;
                    --checkout-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                    --checkout-bg: #ffffff;
                    --checkout-border-radius: 8px;
                    --checkout-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    --checkout-button-text-color: #ffffff;
                    --checkout-error-color: #ef4444;
                    --checkout-success-color: #10b981;
                    
                    display: block;
                    font-family: var(--checkout-font);
                    width: 100%;
                }

                .checkout-container {
                    background-color: var(--checkout-bg);
                    padding: 24px;
                    border-radius: var(--checkout-border-radius);
                    box-shadow: var(--checkout-box-shadow);
                }

                #payment-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                /* Stripe Element Container */
                #payment-element {
                    min-height: 200px; /* Prevent layout shift */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }

                .skeleton {
                    width: 100%;
                    height: 200px;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: loading-skeleton 1.5s infinite;
                    border-radius: 6px;
                }

                @keyframes loading-skeleton {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                button {
                    background-color: var(--checkout-primary-color);
                    color: var(--checkout-button-text-color);
                    font-family: var(--checkout-font);
                    border: none;
                    border-radius: 6px;
                    padding: 14px 16px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s ease, transform 0.1s ease;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                button:hover:not(:disabled) {
                    opacity: 0.9;
                }

                button:active:not(:disabled) {
                    transform: scale(0.98);
                }

                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Spinner styles */
                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .hidden {
                    display: none !important;
                }

                #error-message {
                    color: var(--checkout-error-color);
                    font-size: 14px;
                    background-color: #fef2f2;
                    border: 1px solid #fecaca;
                    padding: 12px;
                    border-radius: 6px;
                    display: none;
                }

                #success-message {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px 20px;
                    color: #111827;
                }

                .success-icon {
                    width: 64px;
                    height: 64px;
                    background-color: #ecfdf5;
                    color: var(--checkout-success-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin-bottom: 20px;
                }

                h3 { margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #111827; }
                p { margin: 0; color: #4b5563; line-height: 1.5; font-size: 16px; }

                .secured-by {
                    text-align: center;
                    font-size: 13px;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 16px;
                }

                .terms-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 4px 0;
                    cursor: pointer;
                    user-select: none;
                }

                .terms-container input {
                    width: 18px;
                    height: 18px;
                    margin-top: 2px;
                    cursor: pointer;
                    accent-color: var(--checkout-primary-color);
                }

                .terms-text {
                    font-size: 14px;
                    line-height: 1.4;
                    color: #4b5563;
                }

                .terms-text a {
                    color: var(--checkout-primary-color);
                    text-decoration: underline;
                }
            </style>

            <div class="checkout-container">
                <form id="payment-form">
                    <!-- Stripe injects the Payment Element here -->
                    <div id="payment-element">
                        <div class="skeleton"></div>
                    </div>
                    
                    <div id="error-message"></div>

                    <label class="terms-container">
                        <input type="checkbox" id="terms-checkbox">
                        <span class="terms-text">
                            I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and 
                            <a href="/privacy" target="_blank">Privacy Policy</a>.
                        </span>
                    </label>
                    
                    <button id="submit-btn" type="submit" disabled>
                        <div id="spinner" class="spinner hidden"></div>
                        <span id="button-text">Pay Now</span>
                    </button>

                    <div class="secured-by">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Secured by Stripe
                    </div>
                </form>

                <div id="success-message">
                    <div class="success-icon">✓</div>
                    <h3>Payment Successful!</h3>
                    <p>Thank you for your purchase. Your order has been confirmed.</p>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('custom-checkout-widget', CustomCheckoutWidget);


