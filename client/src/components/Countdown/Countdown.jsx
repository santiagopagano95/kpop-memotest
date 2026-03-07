import { motion, AnimatePresence } from 'framer-motion';

export default function Countdown({ value }) {
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          key="countdown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={value}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-[10rem] font-black leading-none select-none
                text-transparent bg-clip-text
                bg-gradient-to-b from-pink-400 via-purple-400 to-cyan-400
                drop-shadow-[0_0_40px_rgba(255,100,255,0.8)]"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
