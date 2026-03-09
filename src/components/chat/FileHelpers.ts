import { FileText, FileArchive, FileType, File, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function isImageOrGif(url: string, mimeType?: string): boolean {
  if (mimeType) return mimeType.startsWith('image/');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

export function isVideo(url: string, mimeType?: string): boolean {
  if (mimeType) return mimeType.startsWith('video/');
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType?: string, fileName?: string): LucideIcon {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'ogg'].includes(ext || '')) return Video;
  if (mimeType === 'application/pdf' || ext === 'pdf') return FileText;
  if (mimeType?.includes('zip') || ext === 'zip' || ext === 'rar' || ext === '7z') return FileArchive;
  if (mimeType?.includes('word') || ext === 'doc' || ext === 'docx') return FileType;
  if (mimeType === 'text/plain' || ext === 'txt') return FileText;
  return File;
}

export function isImageExpired(expiry?: number): boolean {
  if (!expiry) return false;
  return Date.now() > expiry;
}

export const ACCEPTED_FILE_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
