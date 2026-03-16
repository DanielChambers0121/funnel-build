import { useState, useRef } from 'react';
import './CustomerInfoForm.css';
import CustomerInfoForm from './CustomerInfoForm';
import './checkout-widget.js';

export default function ExamplePortal({ itemPrice = 99, productName = "Digital Product" }) {
    const [customerData, setCustomerData] = useState(null); // Step 1: Lead Capture
    const widgetRef = useRef(null); // Step 2: Payment Portal

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#1e1e1e', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ color: 'white' }}>Checkout: {productName}</h2>
            <h3 style={{ color: '#4ade80' }}>£{itemPrice}</h3>

            <hr style={{ borderColor: '#333', margin: '20px 0' }} />

            {/* Step 1: Capture the Lead */}
            {!customerData ? (
                <CustomerInfoForm
                    selectedTier={{ name: productName, price: itemPrice }}
                    onComplete={(data) => setCustomerData(data)}
                />
            ) : (
                /* Step 2: Process the Mock Payment securely */
                <custom-checkout-widget
                    ref={widgetRef}
                    backend-url="http://127.0.0.1:3000"
                    stripe-key={import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE'}
                    amount={itemPrice * 100}
                    customer-name={customerData.name}
                    customer-email={customerData.email}
                    affiliate-id="demo-portal">
                </custom-checkout-widget>
            )}
        </div>
    );
}
