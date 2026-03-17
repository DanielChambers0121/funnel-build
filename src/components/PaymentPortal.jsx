import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Lock } from 'lucide-react';
import './PaymentPortal.css';
import './checkout-widget.js'; // Import our new framework-agnostic web component
import CustomerInfoForm from './CustomerInfoForm';

const TIERS = [
    {
        id: 'audit',
        name: "Funnel Audit",
        price: 99,
        description: "A comprehensive teardown of your current funnel with a recorded video analysis.",
        features: ["Video Teardown", "Actionable PDF Report", "15-Min Strategy Call"],
        popular: false
    },
    {
        id: 'build',
        name: "The Quick-Start Build",
        price: 1499,
        description: "We build and launch a high-converting 3-page funnel tailored to your exact offer.",
        features: ["Custom Copywriting", "Premium Design & Setup", "Basic Tech Integrations", "1-Week Turnaround"],
        popular: true
    },
    {
        id: 'dfy',
        name: "The 'Done-For-You' Scaling System",
        price: 4999,
        description: "The ultimate growth engine. Fully automated, robust backend, and advanced optimization.",
        features: ["Complex Multi-Step Funnels", "Advanced CRMs & Integrations", "A/B Testing Setup", "30 Days Active Management"],
        popular: false
    }
];

// CheckoutForm logic decoupled into custom-checkout-widget web component

export default function PaymentPortal({ revenueTier, onSuccess }) {
    // Variable 3: The Recommendation (Based on Revenue)
    let defaultTier = TIERS[1]; // Default to Quick-Start
    let recommendedTierId = null;

    if (revenueTier === "£0-£5k") {
        defaultTier = TIERS[1]; // Build
        recommendedTierId = 'build';
    } else if (revenueTier === "£5k-£20k") {
        defaultTier = TIERS[2]; // DFY
        recommendedTierId = 'dfy';
    } else if (revenueTier === "£20k+") {
        defaultTier = TIERS[0]; // Audit
        recommendedTierId = 'audit';
    }

    const [selectedTier, setSelectedTier] = useState(defaultTier);
    const [customerData, setCustomerData] = useState(null); // Tracks step 1 lead capture
    const widgetRef = useRef(null);

    useEffect(() => {
        const widget = widgetRef.current;
        if (!widget) return;

        // Listen to the custom event emitted by our decoupled web component
        const handleSuccess = () => onSuccess();
        widget.addEventListener('payment-success', handleSuccess);

        return () => {
            widget.removeEventListener('payment-success', handleSuccess);
        };
    }, [onSuccess, selectedTier]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="payment-section">
            <div className="container payment-container">

                <div className="payment-header">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="payment-title"
                    >
                        Select Your Implementation Plan
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="payment-subtitle text-muted"
                    >
                        Choose the level of support you need to plug the holes in your leaky bucket.
                    </motion.p>
                </div>

                <motion.div
                    className="pricing-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {TIERS.map((tier) => (
                        <motion.div
                            key={tier.id}
                            variants={itemVariants}
                            className={`pricing-card glass-panel ${tier.id === selectedTier.id ? 'active' : ''} ${tier.popular ? 'popular' : ''} ${tier.id === recommendedTierId ? 'recommended-card' : ''}`}
                        >
                            {tier.id === recommendedTierId && <div className="popular-badge" style={{ backgroundColor: '#ff9900', color: '#000' }}>Recommended For You</div>}
                            {tier.popular && tier.id !== recommendedTierId && <div className="popular-badge">Most Popular</div>}

                            <div className="pricing-header">
                                <h3>{tier.name}</h3>
                                <div className="price">
                                    <span className="currency">£</span>
                                    <span className="amount">{tier.price}</span>
                                    {tier.id !== 'audit' && <span className="period">/one-time</span>}
                                </div>
                                <p className="tier-desc">{tier.description}</p>
                            </div>

                            <div className="pricing-features">
                                {tier.features.map((feature, idx) => (
                                    <div key={idx} className="feature-item">
                                        <Check size={16} className="feature-check" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pricing-action">
                                <button
                                    className={`btn-select ${tier.id === selectedTier.id ? 'btn-selected' : ''}`}
                                    onClick={() => setSelectedTier(tier)}
                                >
                                    {tier.id === selectedTier.id ? 'Selected' : 'Select Plan'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Checkout Form UI */}
                <motion.div
                    className="checkout-container glass-panel"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="checkout-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>{selectedTier.name}</span>
                            <span>£{selectedTier.price}</span>
                        </div>
                        <div className="summary-total">
                            <span>Total due today</span>
                            <span>£{selectedTier.price}</span>
                        </div>
                        <div className="trust-badges">
                            <div className="badge"><ShieldCheck size={16} /> SSL Secure</div>
                            <div className="badge"><Lock size={16} /> Encrypted</div>
                        </div>
                    </div>

                    {!customerData ? (
                        <CustomerInfoForm
                            selectedTier={selectedTier}
                            onComplete={(data) => setCustomerData(data)}
                        />
                    ) : (
                        <custom-checkout-widget
                            ref={widgetRef}
                            backend-url="/api"
                            stripe-key={import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE'}
                            amount={selectedTier.price * 100}
                            customer-name={customerData.name}
                            customer-email={customerData.email}
                            affiliate-id="funnel-builder">
                        </custom-checkout-widget>
                    )}
                </motion.div>

            </div>
        </section>
    );
}
