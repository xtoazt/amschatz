import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { formatFileSize } from './FileHelpers';

export interface InspectedVideo {
  name: string;
  size?: number;
  url: string;
  mimeType?: string;
  timestamp?: number;
}

interface VideoInspectorProps {
  video: InspectedVideo;
  onClose: () => void;
}

function getFileExtension(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'VIDEO';
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VideoInspector({ video, onClose }: VideoInspectorProps) {
  const { name: fileName, size: fileSize, url: fileUrl, mimeType, timestamp } = video;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const displayMimeType = mimeType || `video/${getFileExtension(fileName).toLowerCase()}`;

  const metadataRows = [
    { label: 'Size', value: fileSize !== undefined ? formatFileSize(fileSize) : '—' },
    { label: 'Type', value: displayMimeType },
    { label: 'Uploaded', value: formatDate(timestamp) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="bg-background border border-foreground rounded-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-mono text-foreground break-all leading-snug font-medium">
              {fileName}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {getFileExtension(fileName)} file
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-background hover:bg-foreground transition-colors active:scale-[0.95] shrink-0"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>

        {/* Video player */}
        <div className="mx-5 mt-4 rounded-xl overflow-hidden border border-foreground/20 bg-black">
          <video
            src={fileUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[320px] object-contain"
          />
        </div>

        {/* Metadata grid */}
        <div className="mx-5 mt-3 border border-foreground/20 rounded-2xl overflow-hidden">
          {metadataRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-4 py-2.5 ${
                i < metadataRows.length - 1 ? 'border-b border-foreground/10' : ''
              }`}
            >
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                {row.label}
              </span>
              <span className="text-xs font-mono text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="p-5 pt-4">
          <motion.button
            onClick={handleDownload}
            whileTap={{ scale: 0.95 }}
            className="w-full py-2.5 px-4 bg-foreground text-background font-mono text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
