import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface VideoAttachmentProps {
  fileUrl: string;
  fileName: string;
  isOwn: boolean;
  onOpen: () => void;
}

export function VideoAttachment({ fileUrl, fileName, isOwn, onOpen }: VideoAttachmentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailReady, setThumbnailReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => setThumbnailReady(true);
    video.addEventListener('loadeddata', handleLoaded);
    return () => video.removeEventListener('loadeddata', handleLoaded);
  }, []);

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.97 }}
      className="relative block w-full max-w-[240px] rounded-lg overflow-hidden border border-foreground/10 mb-1 group cursor-pointer"
    >
      <video
        ref={videoRef}
        src={fileUrl}
        preload="metadata"
        muted
        playsInline
        className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-300"
      />
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/30 group-hover:bg-background/10 transition-colors">
        <div className="w-10 h-10 rounded-full bg-background/80 border border-foreground/20 flex items-center justify-center backdrop-blur-sm">
          <Play className="w-4 h-4 text-foreground ml-0.5" />
        </div>
      </div>
      {/* File name */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-background/80 to-transparent">
        <span className="text-[10px] font-mono text-foreground truncate block">{fileName}</span>
      </div>
    </motion.button>
  );
}
