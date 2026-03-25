import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import './VideoIntro.css';

export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    console.log("VideoIntro mounted");
    // Show skip button after 2 seconds
    const timer = setTimeout(() => {
      console.log("Showing skip button");
      setShowSkip(true);
    }, 2000);
    
    // Try to play with audio after a short delay to give component time to mount
    const playVideo = setTimeout(() => {
      if (videoRef.current) {
        // Attempt to play with audio first
        videoRef.current.muted = false;
        videoRef.current.play().then(() => {
          console.log("Video playing with audio");
          setIsPlaying(true);
          setIsMuted(false);
        }).catch(error => {
          console.log("Autoplay with audio blocked, falling back to muted:", error);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(e => console.error("Muted autoplay also failed:", e));
          }
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(playVideo);
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

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
          />
          
          <div className="video-audio-toggle" onClick={toggleMute}>
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </div>
          
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
