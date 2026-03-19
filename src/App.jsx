import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hexagon, ShieldCheck, Mail, Phone, Instagram } from 'lucide-react';
import Hero from './components/Hero';
import Quiz from './components/Quiz';
import ResultsPage from './components/ResultsPage';
import PaymentPortal from './components/PaymentPortal';

const WhatsAppIcon = ({ size = 24, color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133-.298-.347-.446-.52-.149-.174-.198-.298-.298-.497-.099-.198-.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

function App() {
  const [funnelStep, setFunnelStep] = useState('HERO'); // HERO, QUIZ, RESULTS, PAYMENT, THANK_YOU
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const startQuiz = () => {
    setFunnelStep('QUIZ');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizComplete = (answers) => {
    setQuizAnswers(answers);
    setFunnelStep('RESULTS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const proceedToCheckout = () => {
    setFunnelStep('PAYMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSuccess = () => {
    setFunnelStep('THANK_YOU');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="app-nav">
        <div className="container">
          <a href="/" className="brand-logo" onClick={(e) => { e.preventDefault(); setFunnelStep('HERO'); }}>
            <Hexagon size={28} color="var(--accent-color)" />
            D'Solutions
          </a>
        </div>
      </nav>

      {!hasAcceptedTerms && (
        <div className="terms-overlay">
          <div className="terms-modal glass-panel">
            <h2>Service Terms &amp; Conditions</h2>
            <p className="terms-updated">Last updated: March 17, 2026</p>
            <div className="terms-content">
              <p>
                Please review our{' '}
                <a
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  full Service Terms &amp; Conditions
                </a>
                . By continuing, you acknowledge that you have had the opportunity to read this document.
              </p>
            </div>

            <div className="terms-actions">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                />
                <span>
                  I understand and agree to the Service Terms &amp; Conditions, including that all sales are final and that no specific business results are guaranteed, whether or not I open or read the full document.
                </span>
              </label>
              <button
                className="btn-primary"
                disabled={!termsChecked}
                onClick={() => setHasAcceptedTerms(true)}
              >
                Enter Site
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <AnimatePresence mode="wait">
          {funnelStep === 'HERO' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Hero onStartQuiz={startQuiz} />
            </motion.div>
          )}

          {funnelStep === 'QUIZ' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Quiz onQuizComplete={handleQuizComplete} />
            </motion.div>
          )}

          {funnelStep === 'RESULTS' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsPage answers={quizAnswers} onProceed={proceedToCheckout} />
            </motion.div>
          )}

          {funnelStep === 'PAYMENT' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PaymentPortal revenueTier={quizAnswers ? quizAnswers[2] : null} onSuccess={handlePaymentSuccess} />
            </motion.div>
          )}

          {funnelStep === 'THANK_YOU' && (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <section className="results-section" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <ShieldCheck size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
                <h2 style={{ fontSize: '3rem', marginBottom: '16px' }}>Welcome to the Ecosystem.</h2>
                <p style={{ color: '#888891', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                  Your payment was completed securely. We've just sent your onboarding blueprint to your email address. Check your inbox to begin Phase 1.
                </p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <div className="container footer-container">
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-details">
              <div className="contact-item">
                <Phone size={16} />
                <span>07400067833</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>7hurtz89@gmail.com</span>
              </div>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" aria-label="WhatsApp">
                <WhatsAppIcon size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} D'Solutions. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
