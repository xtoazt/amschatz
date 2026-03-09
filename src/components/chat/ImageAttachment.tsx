import { forwardRef } from 'react';

interface ImageAttachmentProps {
  imageUrl: string;
  hasText: boolean;
  expired: boolean;
  onImageClick: (url: string) => void;
}

export const ImageAttachment = forwardRef<HTMLDivElement, ImageAttachmentProps>(
  function ImageAttachment({ imageUrl, hasText, expired, onImageClick }, ref) {
    if (expired) {
      return <span className="text-[11px] italic text-muted-foreground">Image expired</span>;
    }

    return (
      <div ref={ref} className="relative">
        <img
          src={imageUrl}
          alt="Shared image"
          onClick={() => onImageClick(imageUrl)}
          className="max-w-full rounded-lg mb-1 border border-foreground/20 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
          loading="lazy"
        />
        {!hasText && imageUrl.includes('klipy') && (
          <span className="absolute bottom-2 right-1.5 text-[8px] font-mono text-foreground/80 bg-background/60 px-1 py-0.5 rounded">via KLIPY</span>
        )}
      </div>
    );
  }
);
