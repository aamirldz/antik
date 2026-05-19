/**
 * frameLoader.ts — Async Image Frame Preloader
 * 
 * Preloads an array of image URLs into memory so the canvas
 * frame sequence can render them instantly without network lag.
 * 
 * Uses image.decode() for jank-free decoding off the main thread.
 * Reports progress via a callback for the preloader bar.
 */

export interface FrameLoadResult {
  frames: HTMLImageElement[];
  totalLoaded: number;
}

/**
 * Preload a sequence of images.
 * 
 * @param urls - Array of image URLs to preload
 * @param onProgress - Callback with (loaded, total) count
 * @returns Promise resolving to array of loaded Image elements
 */
export async function preloadFrames(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<HTMLImageElement[]> {
  const total = urls.length;
  let loaded = 0;
  const frames: HTMLImageElement[] = new Array(total);

  // Load all images in parallel (browser will naturally limit concurrent requests)
  const promises = urls.map((url, index) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;

      img.onload = async () => {
        // Use decode() if available for smoother rendering
        try {
          await img.decode();
        } catch {
          // decode() not supported or failed — image is still usable
        }

        frames[index] = img;
        loaded++;
        onProgress?.(loaded, total);
        resolve();
      };

      img.onerror = () => {
        // On error, still increment count and use a placeholder
        console.warn(`Failed to load frame: ${url}`);
        frames[index] = img; // Will render as empty/broken
        loaded++;
        onProgress?.(loaded, total);
        resolve();
      };
    });
  });

  await Promise.all(promises);
  return frames;
}

/**
 * Generate an array of sequential frame URLs.
 * 
 * @param basePath - Directory containing frames (e.g., '/frames/hero/')
 * @param prefix - File prefix (e.g., 'frame_')
 * @param count - Total number of frames
 * @param extension - File extension (e.g., 'webp')
 * @param padLength - Zero-padding length for numbers (e.g., 3 → "001")
 */
export function generateFrameUrls(
  basePath: string,
  prefix: string,
  count: number,
  extension: string = 'webp',
  padLength: number = 3
): string[] {
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const num = String(i).padStart(padLength, '0');
    urls.push(`${basePath}${prefix}${num}.${extension}`);
  }
  return urls;
}
