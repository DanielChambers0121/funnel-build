import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, User, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CustomerInfoForm.css';

export default function CustomerInfoForm({ onComplete, selectedTier }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Insert lead directly into Supabase.
            // Security is enforced by RLS: anonymous users can only INSERT.
            const { error: supabaseError } = await supabase
                .from('leads')
                .insert([{
                    name,
                    email,
                    phone: null,
                    answers: {
                        source: window.location.hostname || 'funnel-builder',
                        tier: selectedTier?.name || 'unknown'
                    }
                }]);

            if (supabaseError) {
                throw new Error(supabaseError.message || 'Failed to save your details.');
            }

            // Tell parent component (PaymentPortal) that data is securely captured
            onComplete({ name, email });

        } catch (err) {
            console.error('Lead capture error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <motion.div
            className="customer-info-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="form-header">
                <h4>Where should we send your access?</h4>
                <p>Enter your details below to continue to secure checkout.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="name">Full Name</label>
                    <div className="input-icon-wrapper">
                        <User className="input-icon" size={18} />
                        <input
                            id="name"
                            type="text"
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-icon-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="continue-btn"
                    disabled={isLoading || !name || !email}
                >
                    {isLoading ? 'Saving...' : 'Continue to Payment'}
                    {!isLoading && <ArrowRight size={18} />}
                </button>
            </form>
        </motion.div>
    );
}
