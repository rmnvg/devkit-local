import QRCode from 'qrcode';

export type Ecc = 'L' | 'M' | 'Q' | 'H';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface QrOptions {
  ecc: Ecc;
  margin: number;
  dark: string;
  light: string;
}

export async function qrSvg(text: string, o: QrOptions): Promise<Result<string>> {
  if (!text) return { ok: false, error: 'Enter text or a URL.' };
  try {
    const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: o.ecc, margin: o.margin, color: { dark: o.dark, light: o.light } });
    return { ok: true, value: svg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: /too big|amount of data/i.test(msg) ? 'Too much data for a QR code. Shorten the text or lower the error correction level.' : msg };
  }
}

/** Build payloads for common QR formats. */
export function wifiPayload(ssid: string, password: string, security: 'WPA' | 'WEP' | 'nopass', hidden: boolean): string {
  const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:${security};S:${esc(ssid)};${security === 'nopass' ? '' : `P:${esc(password)};`}${hidden ? 'H:true;' : ''};`;
}

export function hexColor(c: string): boolean {
  return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
}
