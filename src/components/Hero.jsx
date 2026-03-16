import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Activity, Zap, Shield } from 'lucide-react';
import './Hero.css';

export default function Hero({ onStartQuiz }) {
    // Scroll-linked animation for the video background
    const { scrollY } = useScroll();
    const videoY = useTransform(scrollY, [0, 1000], ['0%', '20%']); // Parallax effect

    // Container variants for staggered entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <section className="hero-section">
            <motion.div className="hero-video-container" style={{ y: videoY }}>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hero-video"
                >
                    <source src="/dsolutions logo kitsune.mp4" type="video/mp4" />
                </video>
                <div className="hero-video-overlay"></div>
            </motion.div>

            <div className="container hero-container">

                {/* Abstract Background Elements */}
                <div className="hero-glow primary-glow"></div>
                <div className="hero-glow secondary-glow"></div>

                <motion.div
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="badge">
                        <Activity className="badge-icon" size={16} />
                        <span>The Interactive Architecture System</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="hero-title">
                        Your Business is a <br />
                        <span className="text-gradient highlight-text">Leaky Bucket.</span> <br />
                        Let’s Plug the Holes.
                    </motion.h1>

                    <motion.p variants={itemVariants} className="hero-subtitle">
                        Stop losing leads to outdated static websites. We build high-converting, interactive sales funnels that turn cold traffic into high-ticket clients.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="hero-cta-wrapper"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <button
                            className="btn-primary cta-pulse"
                            onClick={onStartQuiz}
                        >
                            <Zap size={20} />
                            Launch the Funnel Blueprint Engine
                            <ArrowRight size={20} className="cta-arrow" />
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="trust-indicators">
                        <div className="trust-item">
                            <Shield size={16} />
                            <span>Data-Driven Design</span>
                        </div>
                        <div className="trust-divider"></div>
                        <div className="trust-item">
                            <Activity size={16} />
                            <span>Conversion Optimized</span>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
}
