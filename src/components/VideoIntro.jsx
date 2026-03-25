import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, ArrowRight } from 'lucide-react';
import './VideoIntro.css';

export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    console.log("VideoIntro mounted");
    // Show skip button after 2 seconds
    const timer = setTimeout(() => {
      console.log("Showing skip button");
      setShowSkip(true);
    }, 2000);
    
    // Check if autoplay worked
    const checkAutoplay = setTimeout(() => {
      if (videoRef.current && videoRef.current.paused) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkAutoplay);
    };
  }, []);

  const handlePlay = () => {
    console.log("Handle Play clicked");
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    console.log("Video Ended - proceeding to next step");
    onComplete();
  };

  return (
    <div className="video-intro-container">
      <motion.div 
        className="video-frame glass-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="video-wrapper">
          <video
            ref={videoRef}
            src="/intro-video.mp4"
            className="intro-video"
            onEnded={handleVideoEnd}
            onError={(e) => console.error("Video loading error:", e)}
            onPlay={() => console.log("Video started playing")}
            playsInline
            autoPlay
            muted
          />
          
          {!isPlaying && (
            <div className="video-overlay" onClick={handlePlay}>
              <motion.button 
                className="play-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Play size={48} fill="currentColor" />
              </motion.button>
            </div>
          )}
        </div>

        <div className="video-controls">
          {showSkip && (
            <button className="skip-link" onClick={onComplete}>
              Skip Video & Proceed <SkipForward size={16} />
            </button>
          )}
        </div>
      </motion.div>

      <motion.div 
        className="video-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <button className="btn-primary" onClick={onComplete} style={{ width: 'auto', minWidth: '240px' }}>
          Proceed to Blueprint Engine <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
}
