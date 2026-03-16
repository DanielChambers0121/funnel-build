import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Activity, PlaySquare } from 'lucide-react';
import './ResultsPage.css';

export default function ResultsPage({ answers, onProceed }) {
    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        // Simulate complex calculation
        const timer = setTimeout(() => {
            setIsCalculating(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Complex Logic for Dynamic Results
    const goal = answers[1]; // Value like "Lead Gen"
    const revenue = answers[2]; // e.g. "£0-£5k", "£5k-£20k", "£20k+" 
    const bottleNeck = answers[3]; // Value like "Conversion"

    // Variable 1: The Diagnosis (Based on Bottleneck)
    let resultTitle = "";
    if (bottleNeck === "Traffic") {
        resultTitle = "Diagnosis: You don't have a traffic problem; you have a conversion problem. You need a funnel that allows you to afford higher customer acquisition costs.";
    } else if (bottleNeck === "Conversion") {
        resultTitle = "Diagnosis: Your traffic is leaking. We need to patch the holes, remove friction, and drastically increase your Revenue Per Visitor (RPV).";
    } else if (bottleNeck === "Tech Overwhelm") {
        resultTitle = "Diagnosis: You are the bottleneck. It's time to completely automate your sales architecture so you can get back to actually running your business.";
    }

    // Variable 2: The Prescription (Based on Goal)
    let blueprintTitle = "";
    let blueprintDesc = "";
    if (goal === "Lead Gen") {
        blueprintTitle = "Your Blueprint: The Authority Magnet Funnel";
        blueprintDesc = "You need a high-converting opt-in page leading directly to a Value Video (VSL), seamlessly pushing qualified leads into an automated calendar booking system.";
    } else if (goal === "Direct Sales") {
        blueprintTitle = "Your Blueprint: The High-AOV Cart Funnel";
        blueprintDesc = "You need a frictionless sales page paired with strategic Order Bumps and One-Click Upsells to maximize the lifetime value of every single checkout.";
    } else if (goal === "Brand Authority") {
        blueprintTitle = "Your Blueprint: The Ecosystem Nurture Funnel";
        blueprintDesc = "You need a lead-capture ecosystem that feeds into a highly automated, value-driven email sequence, establishing trust before pitching high-ticket offers.";
    }

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="results-section">
            <div className="results-split-layout">
                {/* Image Pane to maintain consistency with Quiz */}
                <motion.div
                    className="results-image-pane"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <div className="results-image-overlay"></div>
                </motion.div>

                <div className="results-content-pane">
                    <div className="container results-container">
                        <AnimatePresence mode="wait">
                            {isCalculating ? (
                                <motion.div
                                    key="loading"
                                    className="loading-state"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <Loader2 className="spinner" size={48} />
                                    <h2>Analyzing Your Architecture...</h2>
                                    <p className="text-muted">Running blueprint simulations against {goal} benchmarks.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="results"
                                    className="results-content glass-panel"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div variants={itemVariants} className="results-badge">
                                        <Activity size={16} />
                                        <span>Blueprint Generated</span>
                                    </motion.div>

                                    <motion.h2 variants={itemVariants} className="results-title">
                                        {resultTitle}
                                    </motion.h2>

                                    <motion.div variants={itemVariants} className="prescription-box">
                                        <h3 className="prescription-highlight">{blueprintTitle}</h3>
                                        <p>{blueprintDesc}</p>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="action-area">
                                        <button className="btn-primary pulse-minor" onClick={() => onProceed(revenue)}>
                                            View Implementation Plans
                                            <PlaySquare size={20} />
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
