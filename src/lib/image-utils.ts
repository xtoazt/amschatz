/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Max upload size in bytes (2 MB) */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Validates a File is an accepted image type and within the size limit.
 * Returns an error string or null.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, and WebP images are supported.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be smaller than 2 MB.';
  }
  return null;
}

/**
 * Compresses/resizes an image File using a Canvas and returns a base64 data URL.
 * GIFs are passed through as-is (canvas strips animation).
 * Target long-edge: 1200px. JPEG quality: 0.82.
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  // For GIF pass through without re-encoding to preserve frames
  if (file.type === 'image/gif') {
    return readFileAsDataUrl(file);
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const MAX_EDGE = 1200;
  let { width, height } = img;

  if (width > MAX_EDGE || height > MAX_EDGE) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_EDGE);
      width = MAX_EDGE;
    } else {
      width = Math.round((width / height) * MAX_EDGE);
      height = MAX_EDGE;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(outputType, 0.82);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
