import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hexagon, ShieldCheck } from 'lucide-react';
import Hero from './components/Hero';
import Quiz from './components/Quiz';
import ResultsPage from './components/ResultsPage';
import PaymentPortal from './components/PaymentPortal';
import VideoIntro from './components/VideoIntro';

function App() {
  const [funnelStep, setFunnelStep] = useState('HERO'); // HERO, VIDEO_INTRO, QUIZ, RESULTS, PAYMENT, THANK_YOU
  const [quizAnswers, setQuizAnswers] = useState(null);

  const startVideoIntro = () => {
    console.log("Transitioning to VIDEO_INTRO");
    setFunnelStep('VIDEO_INTRO');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startQuiz = () => {
    console.log("Transitioning to QUIZ");
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

      <main>
        <AnimatePresence mode="wait">
          {funnelStep === 'HERO' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Hero onStartQuiz={startVideoIntro} />
            </motion.div>
          )}

          {funnelStep === 'VIDEO_INTRO' && (
            <motion.div
              key="video-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <VideoIntro onComplete={startQuiz} />
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
    </>
  );
}

export default App;
