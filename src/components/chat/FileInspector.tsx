import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check } from 'lucide-react';
import { getFileIcon, formatFileSize } from './FileHelpers';

export interface InspectedFile {
  name: string;
  size?: number;
  url: string;
  mimeType?: string;
  timestamp?: number;
}

interface FileInspectorProps {
  file: InspectedFile;
  onClose: () => void;
}

function getFileExtension(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
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

export function FileInspector({ file, onClose }: FileInspectorProps) {
  const { name: fileName, size: fileSize, url: fileUrl, mimeType, timestamp } = file;
  const IconComponent = getFileIcon(mimeType, fileName);
  const isTextFile = /\.(txt|md|log|csv|json|xml|yaml|yml|js|ts|tsx|jsx|css|html|py|rb|go|rs|sh|env)$/i.test(fileName);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isTextFile) return;
    setLoadingText(true);
    fetch(fileUrl)
      .then(res => res.text())
      .then(text => setTextContent(text))
      .catch(() => setTextContent('Failed to load file content.'))
      .finally(() => setLoadingText(false));
  }, [fileUrl, isTextFile]);

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

  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = textContent || fileName;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  }, [textContent, fileName]);

  const displayMimeType = mimeType || `application/${getFileExtension(fileName).toLowerCase()}`;

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
        className={`bg-background border border-foreground rounded-2xl w-full overflow-hidden ${isTextFile ? 'max-w-lg' : 'max-w-sm'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              layoutId="file-inspector-icon"
              className="w-11 h-11 border border-foreground rounded-xl flex items-center justify-center shrink-0"
            >
              <IconComponent className="w-5 h-5 text-foreground" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-mono text-foreground break-all leading-snug font-medium">
                {fileName}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {getFileExtension(fileName)} file
              </p>
            </div>
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

        {/* Metadata grid */}
        <div className="mx-5 mt-4 border border-foreground/20 rounded-2xl overflow-hidden">
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

        {/* Text preview */}
        {isTextFile && (
          <div className="mx-5 mt-3 border border-foreground/20 rounded-2xl max-h-56 overflow-y-auto scrollbar-thin">
            {loadingText ? (
              <div className="p-4 text-xs font-mono text-muted-foreground">Loading...</div>
            ) : (
              <pre className="p-4 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
                {textContent}
              </pre>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="p-5 pt-4 flex gap-2">
          <motion.button
            onClick={handleDownload}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 px-4 bg-foreground text-background font-mono text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>

          {isTextFile && (
            <motion.button
              onClick={handleCopy}
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-2.5 px-4 border border-foreground text-foreground font-mono text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition-colors relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
              {copied && (
                <motion.div
                  className="absolute inset-0 bg-foreground/10 rounded-xl"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
