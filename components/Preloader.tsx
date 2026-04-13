import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight, ChevronLeft } from 'lucide-react';

const SONGS = [
  {
    id: 'golden-hour',
    title: 'Golden Hour',
    artist: 'JVKE',
    image: '/img1.jpg'
  },
  {
    id: 'interstellar',
    title: 'Interstellar x Experience',
    artist: 'Clavier',
    image: '/img2.jpg'
  },
  {
    id: 'sailor-song',
    title: 'Sailor Song',
    artist: 'Gigi Perez',
    image: '/img3.jpg'
  },
  {
    id: 'her',
    title: 'her',
    artist: 'JVKE',
    image: '/img4.jpg'
  },
  {
    id: 'sweater-weather',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    image: '/sweater-weather.jpg'
  },
  {
    id: 'finding-her',
    title: 'Finding Her',
    artist: 'Kushagra, Bharath, Saaheal',
    image: '/finding-her.jpg'
  },
  {
    id: 'ninna-notavu',
    title: 'Ninna Notavu',
    artist: 'Tanmay Gururaj',
    image: '/ninna-notavu.jpg'
  },
  {
    id: 'priya-phool',
    title: 'Priya Phool',
    artist: 'Kobid Bazra, Bikesh Bazra, Deepson Putuwar, Kriti Nepali, Sujan Chapagain',
    image: '/priya-phool.jpg'
  }
];

interface PreloaderProps {
  onComplete: (songId: string | null) => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'welcome' | 'intro1' | 'intro2' | 'selection' | 'transitioning'>('welcome');
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // approximate width of card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (phase === 'welcome') {
      const t = setTimeout(() => setPhase('intro1'), 3000);
      return () => clearTimeout(t);
    } else if (phase === 'intro1') {
      const t = setTimeout(() => setPhase('intro2'), 2500);
      return () => clearTimeout(t);
    } else if (phase === 'intro2') {
      const t = setTimeout(() => setPhase('selection'), 5000); // Give them time to read the combined screen
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleContinue = () => {
    setPhase('transitioning');
    setTimeout(() => {
      onComplete(selectedSong);
    }, 800); // reduced from 1500
  };

  const handleSkip = () => {
    setPhase('transitioning');
    setTimeout(() => {
      onComplete(null);
    }, 800);
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center text-white overflow-hidden"
      animate={{ backgroundColor: phase === 'transitioning' ? 'rgba(5,5,5,0)' : 'rgba(5,5,5,1)' }}
      transition={{ duration: 1.5 }}
    >
      {/* Ambient Background */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: phase === 'transitioning' ? 0 : 0.3,
          background: [
            'radial-gradient(circle at 20% 30%, rgba(30,30,50,0.4) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 70%, rgba(50,30,50,0.4) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 30%, rgba(30,30,50,0.4) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-light tracking-widest mb-4">WELCOME TO FLUX CORE</h1>
            <p className="text-lg text-white/50 font-light tracking-wide">Thank you for visiting our universe.</p>
          </motion.div>
        )}

        {phase === 'intro1' && (
          <motion.div
            key="intro1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="text-xl md:text-2xl font-light tracking-wide"
          >
            "This experience is audio-reactive."
          </motion.div>
        )}

        {phase === 'intro2' && (
          <motion.div
            key="intro2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <p className="text-xl md:text-2xl font-light tracking-wide text-white/70 mb-2">
              "For best results..."
            </p>

            <motion.div
              animate={{ 
                boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.15)', '0 0 0px rgba(255,255,255,0)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="rounded-full overflow-hidden border border-white/10 w-32 h-32 md:w-40 md:h-40 relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80" 
                alt="Premium Headphones" 
                className="w-full h-full object-cover grayscale opacity-80 mix-blend-screen"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 rounded-full pointer-events-none"></div>
            </motion.div>

            <div className="space-y-2">
              <p className="text-xl font-medium tracking-wide">Wear headphones</p>
              <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">Dim the lights and use a laptop for the best experience.</p>
            </div>

            <button 
              onClick={() => setPhase('selection')}
              className="mt-4 text-xs text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
            >
              Skip Intro
            </button>
          </motion.div>
        )}

        {(phase === 'selection' || phase === 'transitioning') && (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full h-full flex flex-col items-center justify-center px-4"
          >
            <motion.div 
              className="mb-8 text-center"
              animate={{ opacity: phase === 'transitioning' ? 0 : 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-light tracking-widest mb-2">SELECT A TRACK</h2>
              <div className="flex items-center justify-center gap-2 text-white/50 text-xs uppercase tracking-widest animate-pulse">
                <ChevronLeft size={14} />
                <span>Swipe or scroll to explore 8 tracks</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>

            {/* Horizontal Scroll Container Wrapper */}
            <div className="relative w-full max-w-7xl mx-auto flex items-center group">
              {/* Left Arrow */}
              <button 
                onClick={() => scroll('left')}
                className="hidden md:flex absolute -left-4 md:left-2 z-20 p-3 bg-black/50 hover:bg-white/10 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 text-white/70 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Horizontal Scroll Container */}
              <div 
                ref={scrollContainerRef}
                className="w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 pt-4 px-4 md:px-16 flex gap-6 md:gap-8 items-center"
              >
                {SONGS.map((song) => {
                const isSelected = selectedSong === song.id;
                const isFaded = selectedSong && !isSelected;

                return (
                  <motion.div
                    key={song.id}
                    className={`relative shrink-0 snap-center cursor-pointer rounded-2xl overflow-hidden transition-all duration-500
                      ${isSelected ? 'ring-2 ring-white/80 shadow-[0_0_30px_rgba(255,255,255,0.2)] z-10' : 'ring-1 ring-white/10 hover:ring-white/30'}
                      ${isFaded ? 'opacity-40 scale-95 grayscale-[50%]' : 'opacity-100'}
                    `}
                    style={{
                      width: '280px',
                      height: '420px',
                    }}
                    animate={
                      phase === 'transitioning' 
                        ? (isSelected ? { scale: 5, opacity: 0, filter: 'blur(10px)' } : { opacity: 0, scale: 0.8 })
                        : { scale: isFaded ? 0.95 : 1 }
                    }
                    transition={{ duration: phase === 'transitioning' ? 1.5 : 0.5, ease: "easeInOut" }}
                    whileHover={!selectedSong ? { scale: 1.05, y: -10 } : {}}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSong(song.id)}
                  >
                    <img 
                      src={song.image} 
                      alt={song.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
                        >
                          <Play className="text-white ml-1" fill="currentColor" />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              </div>

              {/* Right Arrow */}
              <button 
                onClick={() => scroll('right')}
                className="hidden md:flex absolute -right-4 md:right-2 z-20 p-3 bg-black/50 hover:bg-white/10 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 text-white/70 hover:text-white"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Controls */}
            <motion.div 
              className="mt-12 h-16 flex flex-col items-center justify-center gap-4 relative z-50"
              animate={{ opacity: phase === 'transitioning' ? 0 : 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence>
                {selectedSong && (
                  <motion.button
                    key="continue-btn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={handleContinue}
                    className="group flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Continue
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>

              {!selectedSong && (
                <button 
                  onClick={handleSkip}
                  className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                >
                  Skip / Enter without music
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </motion.div>
  );
};

export default Preloader;
