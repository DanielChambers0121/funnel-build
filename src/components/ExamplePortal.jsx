import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Mail, User, CreditCard } from 'lucide-react';

// This is a standalone example of how the portal might look within a different context
// It uses similar glassmorphism and premium aesthetics.

export default function ExamplePortal({ itemPrice = 250, productName = \"Digital Product\" }) {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleNext = () => setStep(prev => prev + 1);

    return (
        <div className=\"example-portal-wrapper\">
            <div className=\"glass-panel\" style={{ maxWidth: '400px', margin: '40px auto', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{productName}</h3>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                        £{itemPrice}
                    </div>
                </div>

                <AnimatePresence mode=\"wait\">
                    {step === 1 && (
                        <motion.div
                            key=\"step1\"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <div className=\"input-group\">
                                    <User size={18} className=\"input-icon\" />
                                    <input type=\"text\" placeholder=\"Full Name\" style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff' }} />
                                </div>
                                <div className=\"input-group\">
                                    <Mail size={18} className=\"input-icon\" />
                                    <input type=\"email\" placeholder=\"Email Address\" style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff' }} />
                                </div>
                            </div>
                            <button className=\"btn-primary\" style={{ width: '100%' }} onClick={handleNext}>
                                Continue to Payment
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key=\"step2\"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px dashed var(--panel-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <CreditCard size={16} />
                                    <span>Card details are handled by Stripe</span>
                                </div>
                            </div>
                            <button className=\"btn-primary\" style={{ width: '100%' }} onClick={() => setIsProcessing(true)}>
                                {isProcessing ? 'Processing...' : `Pay £${itemPrice}`}
                            </button>
                            <button 
                                onClick={() => setStep(1)}
                                style={{ width: '100%', marginTop: '12px', padding: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                            >
                                ← Go Back
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', opacity: 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                        <ShieldCheck size={12} /> SSL Secure
                    </div>
                </div>
            </div>
        </div>
    );
}
