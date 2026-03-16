import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import './Quiz.css';

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "What is your primary goal?",
        options: [
            { value: "Lead Gen", label: "Lead Generation", desc: "Capture emails and build a list." },
            { value: "Direct Sales", label: "Direct Sales", desc: "Sell products or services immediately." },
            { value: "Brand Authority", label: "Brand Authority", desc: "Establish trust and credibility." }
        ]
    },
    {
        id: 2,
        question: "Current Monthly Revenue?",
        options: [
            { value: "£0-£5k", label: "£0 - £5k", desc: "Just starting out or early stages." },
            { value: "£5k-£20k", label: "£5k - £20k", desc: "Gaining traction, need optimization." },
            { value: "£20k+", label: "£20k+", desc: "Scaling and looking for high-end systems." }
        ]
    },
    {
        id: 3,
        question: "Biggest Bottleneck?",
        options: [
            { value: "Traffic", label: "Traffic Generation", desc: "Not enough eyeballs on offers." },
            { value: "Conversion", label: "Low Conversion", desc: "People visit but do not buy or opt-in." },
            { value: "Tech Overwhelm", label: "Tech Overwhelm", desc: "Systems are broken or too complex." }
        ]
    }
];

export default function Quiz({ onQuizComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

    const handleOptionSelect = (value) => {
        // Save answer
        const newAnswers = { ...answers, [QUIZ_QUESTIONS[currentStep].id]: value };
        setAnswers(newAnswers);

        // Progression logic with slight delay for UX
        setTimeout(() => {
            if (currentStep < QUIZ_QUESTIONS.length - 1) {
                setDirection(1);
                setCurrentStep(prev => prev + 1);
            } else {
                // Quiz finished
                onQuizComplete(newAnswers);
            }
        }, 400); // 400ms delay to see the active state before moving
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const progressPercentage = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
    const currentQuestion = QUIZ_QUESTIONS[currentStep];

    // Animation variants
    const slideVariants = {
        enter: (dir) => ({
            x: dir > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 }
            }
        },
        exit: (dir) => ({
            zIndex: 0,
            x: dir < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 }
            }
        })
    };

    return (
        <section className="quiz-section">
            {/* Added a split-layout container for consistency and premium feel */}
            <div className="quiz-split-layout">
                <motion.div
                    className="quiz-image-pane"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="quiz-image-overlay"></div>
                </motion.div>

                <div className="quiz-content-pane">
                    <div className="container quiz-container">
                        {/* Progress Header */}
                        <div className="quiz-header glass-panel">
                            <div className="progress-bar-container">
                                <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ ease: "easeInOut", duration: 0.5 }}
                                ></motion.div>
                            </div>
                            <div className="quiz-meta">
                                <span>Step {currentStep + 1} of {QUIZ_QUESTIONS.length}</span>
                                {currentStep > 0 && (
                                    <button className="btn-back" onClick={handleBack}>
                                        Previous Question
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Question Area */}
                        <div className="quiz-card-wrapper">
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="quiz-card"
                                >
                                    <h2 className="question-text">{currentQuestion.question}</h2>

                                    <div className="options-grid">
                                        {currentQuestion.options.map((option, index) => {
                                            const isSelected = answers[currentQuestion.id] === option.value;

                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    className={`option-card glass-panel ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleOptionSelect(option.value)}
                                                    whileHover={{ scale: isSelected ? 1 : 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="option-content">
                                                        <div className="option-icon-wrapper">
                                                            {isSelected ? (
                                                                <CheckCircle2 className="option-icon selected-icon" />
                                                            ) : (
                                                                <div className="option-circle"></div>
                                                            )}
                                                        </div>
                                                        <div className="option-text-group">
                                                            <h3 className="option-label">{option.label}</h3>
                                                            <p className="option-desc">{option.desc}</p>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
