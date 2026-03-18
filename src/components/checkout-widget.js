/*
 * Embedded Checkout Wrapper - Diagnostic Version
 * 
 * Version: 1.0.9+diagnostic-ui (2026-03-18T02:30:00Z)
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
        this.isMounted = false;
        this.diagnosticLogs = [];
    }

    log(msg) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMsg = `[${timestamp}] ${msg}`;
        console.log(`[Stripe Diagnostic] ${formattedMsg}`);
        this.diagnosticLogs.push(formattedMsg);
        this.updateDiagnosticUI();
    }

    connectedCallback() {
        this.render();
        this.log('Component connected to DOM.');
        this.loadStripeScript().then(() => {
            this.log('Stripe JS loaded.');
            return this.initializeCheckout();
        }).catch(err => {
            this.log(`Critical Error: ${err.message}`);
            this.showError('Payment system failed to load.');
        });
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

    updateDiagnosticUI() {
        const logContainer = this.shadowRoot.getElementById('diag-logs');
        if (logContainer) {
            logContainer.innerHTML = this.diagnosticLogs.map(l => `<div>${l}</div>`).join('');
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    async initializeCheckout() {
        const publishableKey = this.getAttribute('stripe-key');
        const backendUrl = this.getAttribute('backend-url');
        const amount = parseInt(this.getAttribute('amount') || '25000', 10);

        this.log(`Initializing with Key: ${publishableKey?.substring(0, 10)}...`);
        this.log(`Target Amount: ${amount}`);

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
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Backend error');
            this.log('Payment Intent created successfully.');

            this.elements = this.stripe.elements({ 
                clientSecret: data.clientSecret,
                appearance: { theme: 'stripe' }
            });
            
            this.paymentElement = this.elements.create('payment');
            const container = this.shadowRoot.getElementById('payment-element');

            this.paymentElement.on('ready', () => {
                this.log('Stripe Element reported READY.');
                this.shadowRoot.querySelector('.skeleton')?.remove();
                container.style.height = 'auto';
                container.style.minHeight = 'unset';
            });

            this.paymentElement.on('loaderror', (event) => {
                this.log(`Stripe Load Error: ${event.error.message}`);
            });

            const mount = () => {
                if (this.isMounted) return;
                this.log('Visibility threshold met. Calling mount()...');
                container.style.minHeight = '350px';
                container.style.background = 'rgba(0,0,0,0.02)';
                
                try {
                    this.paymentElement.mount(container);
                    this.isMounted = true;
                    this.log('Mount function executed.');
                    
                    // Nudge layout
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                        this.log('Layout nudge (resize event) sent.');
                    }, 500);
                } catch (e) {
                    this.log(`Mount Crash: ${e.message}`);
                }
            };

            if (window.IntersectionObserver) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        this.log('Container intersected observer.');
                        mount();
                        observer.disconnect();
                    }
                }, { threshold: 0.01 });
                observer.observe(container);
            } else {
                mount();
            }

        } catch (error) {
            this.log(`Initialization Failed: ${error.message}`);
            this.showError(error.message);
        }
    }

    showError(msg) {
        const err = this.shadowRoot.getElementById('error-message');
        if (err) {
            err.textContent = msg;
            err.style.display = 'block';
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; background: #fff; color: #000; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
                #payment-element { width: 100%; min-height: 100px; margin-bottom: 20px; border: 1px dashed red; }
                .skeleton { height: 350px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #999; }
                #diag-panel { background: #1a1a1a; color: #00ff00; padding: 12px; font-family: monospace; font-size: 11px; border-radius: 4px; margin-top: 20px; max-height: 200px; overflow-y: auto; }
                #diag-header { font-weight: bold; border-bottom: 1px solid #333; margin-bottom: 8px; padding-bottom: 4px; display: flex; justify-content: space-between; }
                .error { color: #ff5555; }
                #submit-btn { width: 100%; padding: 16px; background: #000; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
                #submit-btn:disabled { opacity: 0.3; }
            </style>
            <div id="payment-element">
                <div class="skeleton">Initializing Stripe...</div>
            </div>
            <div id="error-message" style="display:none; color:red; margin-bottom:10px;"></div>
            <button id="submit-btn">Pay Now (Diagnostic Mode)</button>
            <div id="diag-panel">
                <div id="diag-header">
                    <span>STRIPE DIAGNOSTIC LOGS</span>
                    <span style="color:#aaa">v1.0.9</span>
                </div>
                <div id="diag-logs"></div>
            </div>
        `;
    }
}
if (!customElements.get('custom-checkout-widget')) {
    customElements.define('custom-checkout-widget', CustomCheckoutWidget);
}
