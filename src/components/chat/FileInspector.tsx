import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { getFileIcon, formatFileSize } from './FileHelpers';

export interface InspectedFile {
  name: string;
  size?: number;
  url: string;
}

interface FileInspectorProps {
  file: InspectedFile;
  onClose: () => void;
}

export function FileInspector({ file, onClose }: FileInspectorProps) {
  const { name: fileName, size: fileSize, url: fileUrl } = file;
  const IconComponent = getFileIcon(undefined, fileName);
  const isTextFile = fileName.toLowerCase().endsWith('.txt');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`bg-background border border-foreground p-6 w-full space-y-4 ${isTextFile ? 'max-w-lg' : 'max-w-sm'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              layoutId="file-inspector-icon"
              className="w-10 h-10 border border-foreground flex items-center justify-center shrink-0"
            >
              <IconComponent className="w-5 h-5 text-foreground" />
            </motion.div>
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-mono text-foreground break-all">{fileName}</p>
              {fileSize !== undefined && (
                <p className="text-xs font-mono text-muted-foreground">{formatFileSize(fileSize)}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors active:scale-[0.95] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isTextFile && (
          <div className="border border-foreground/20 max-h-64 overflow-y-auto scrollbar-thin">
            {loadingText ? (
              <div className="p-3 text-xs font-mono text-muted-foreground">Loading...</div>
            ) : (
              <pre className="p-3 text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
                {textContent}
              </pre>
            )}
          </div>
        )}

        <button
          onClick={handleDownload}
          className="w-full py-2.5 px-4 bg-foreground text-background font-mono text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all active:scale-[0.95]"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </motion.div>
    </motion.div>
  );
}
