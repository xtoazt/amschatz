import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FullscreenImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export function FullscreenImageViewer({ imageUrl, onClose }: FullscreenImageViewerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.button
        onClick={onClose}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-black border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
        aria-label="Close fullscreen viewer"
        whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.8)' }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-5 h-5" />
      </motion.button>

      <motion.img
        initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        src={imageUrl}
        alt="Fullscreen view"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}
