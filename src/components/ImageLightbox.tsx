import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = 'Image', onClose }: ImageLightboxProps) {
  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = alt !== 'Image' ? alt : 'image';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Top controls */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-end gap-2 p-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Download image"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close image viewer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
