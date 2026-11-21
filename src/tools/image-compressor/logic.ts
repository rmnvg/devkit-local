export type OutputFormat = 'image/jpeg' | 'image/webp' | 'image/png';

/** Scale (w, h) to fit inside (maxW, maxH) without upscaling. 0 = no limit. */
export function fitDimensions(w: number, h: number, maxW: number, maxH: number): { width: number; height: number } {
  let scale = 1;
  if (maxW > 0 && w > maxW) scale = Math.min(scale, maxW / w);
  if (maxH > 0 && h > maxH) scale = Math.min(scale, maxH / h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export function savings(before: number, after: number): string {
  if (!before) return '';
  const pct = ((before - after) / before) * 100;
  return pct >= 0 ? `${pct.toFixed(1)}% smaller` : `${(-pct).toFixed(1)}% larger — try a lower quality or another format`;
}

export function outputName(name: string, format: OutputFormat): string {
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
  return `${name.replace(/\.[^.]+$/, '') || 'image'}-compressed.${ext}`;
}

/** Browser-only: decode, resize and re-encode with canvas. */
export async function compressImage(file: Blob, o: { format: OutputFormat; quality: number; maxWidth: number; maxHeight: number }): Promise<{ blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number }> {
  const bmp = await createImageBitmap(file);
  const { width, height } = fitDimensions(bmp.width, bmp.height, o.maxWidth, o.maxHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  if (o.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'; // JPEG has no alpha
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('This browser cannot encode that format.'))), o.format, o.quality));
  return { blob, width, height, originalWidth: bmp.width || width, originalHeight: bmp.height || height };
}
