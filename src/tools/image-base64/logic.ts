export function snippets(dataUri: string, name: string, width?: number, height?: number): Record<string, string> {
  const alt = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  const dims = width && height ? ` width="${width}" height="${height}"` : '';
  return {
    'Data URI': dataUri,
    'HTML <img>': `<img src="${dataUri}" alt="${alt}"${dims} />`,
    'CSS background': `background-image: url("${dataUri}");`,
    Markdown: `![${alt}](${dataUri})`,
    'Base64 only': dataUri.slice(dataUri.indexOf(',') + 1),
  };
}

/** Base64 grows data by 4/3 (plus padding). */
export function base64Size(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}

export function mediaTypeFor(name: string, type: string): string {
  if (type) return type;
  const ext = name.toLowerCase().split('.').pop();
  return ({ svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon' } as Record<string, string>)[ext ?? ''] ?? 'application/octet-stream';
}
