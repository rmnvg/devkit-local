import { fitDimensions, outputName, savings } from './logic';

describe('image compressor helpers', () => {
  it('fits without upscaling and keeps aspect ratio', () => {
    expect(fitDimensions(4000, 3000, 1920, 0)).toEqual({ width: 1920, height: 1440 });
    expect(fitDimensions(4000, 3000, 1920, 1080)).toEqual({ width: 1440, height: 1080 });
    expect(fitDimensions(800, 600, 1920, 1080)).toEqual({ width: 800, height: 600 });
    expect(fitDimensions(10, 10000, 0, 100)).toEqual({ width: 1, height: 100 });
  });
  it('savings text and output names', () => {
    expect(savings(1000, 250)).toBe('75.0% smaller');
    expect(savings(100, 150)).toMatch(/50\.0% larger/);
    expect(outputName('photo.HEIC', 'image/webp')).toBe('photo-compressed.webp');
    expect(outputName('.png', 'image/jpeg')).toBe('image-compressed.jpg');
  });
});
