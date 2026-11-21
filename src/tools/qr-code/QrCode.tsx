import { useEffect, useState } from 'react';
import { ToolShell } from '@/components/ToolShell';
import { ErrorBox } from '@/components/ErrorBox';
import { Tabs } from '@/components/Tabs';
import { downloadBytes } from '@/components/FileDrop';
import { useToolState } from '@/lib/useToolState';
import { useDebounced } from '@/lib/useDebounced';
import { qrSvg, wifiPayload, type Ecc, type Result } from './logic';

export default function QrCode() {
  const [s, set, api] = useToolState('qr-code', { mode: 'text' as 'text' | 'wifi', text: '', ssid: '', password: '', security: 'WPA' as 'WPA' | 'WEP' | 'nopass', hidden: false, ecc: 'M' as Ecc, margin: 2, dark: '#000000', light: '#ffffff', size: 512 }, ['text', 'ssid', 'password']);
  const payload = useDebounced(s.mode === 'wifi' ? (s.ssid ? wifiPayload(s.ssid, s.password, s.security, s.hidden) : '') : s.text, 150);
  const [r, setR] = useState<Result<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!payload) { setR(null); return; }
    void qrSvg(payload, { ecc: s.ecc, margin: s.margin, dark: s.dark, light: s.light }).then((x) => !cancelled && setR(x));
    return () => { cancelled = true; };
  }, [payload, s.ecc, s.margin, s.dark, s.light]);
  const svg = r?.ok ? r.value : '';
  const src = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';

  const downloadPng = async () => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = s.size;
    c.getContext('2d')!.drawImage(img, 0, 0, s.size, s.size);
    c.toBlob(async (b) => b && downloadBytes(new Uint8Array(await b.arrayBuffer()), 'qr-code.png', 'image/png'), 'image/png');
  };

  return (
    <ToolShell onSample={() => set({ mode: 'text', text: 'https://github.com' })} onClear={() => set({ text: '', ssid: '', password: '' })} output={svg} share={api}>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-3">
          <Tabs label="Content" value={s.mode} onChange={(mode) => set({ mode })} options={[{ value: 'text', label: 'Text / URL' }, { value: 'wifi', label: 'Wi-Fi' }]} />
          {s.mode === 'text' ? (
            <textarea aria-label="QR content" className="code-box min-h-28 w-full resize-y" value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="https://… or any text" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field-label">Network name (SSID)<input className="input" value={s.ssid} onChange={(e) => set({ ssid: e.target.value })} /></label>
              <label className="field-label">Password<input className="input" type="password" autoComplete="off" value={s.password} disabled={s.security === 'nopass'} onChange={(e) => set({ password: e.target.value })} /></label>
              <label className="field-label">Security<select className="select" value={s.security} onChange={(e) => set({ security: e.target.value as 'WPA' })}><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">None</option></select></label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={s.hidden} onChange={(e) => set({ hidden: e.target.checked })} /> Hidden network</label>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="field-label">Error correction<select className="select" value={s.ecc} onChange={(e) => set({ ecc: e.target.value as Ecc })}><option value="L">Low (7%)</option><option value="M">Medium (15%)</option><option value="Q">Quartile (25%)</option><option value="H">High (30%)</option></select></label>
            <label className="field-label">Margin<input className="input" type="number" min={0} max={10} value={s.margin} onChange={(e) => set({ margin: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })} /></label>
            <label className="field-label">Foreground<input type="color" className="h-9 w-full" value={s.dark} onChange={(e) => set({ dark: e.target.value })} /></label>
            <label className="field-label">Background<input type="color" className="h-9 w-full" value={s.light} onChange={(e) => set({ light: e.target.value })} /></label>
          </div>
          {r && !r.ok && <ErrorBox error={r.error} />}
        </div>
        <div className="flex flex-col items-center gap-3">
          <div data-testid="output" className="flex aspect-square w-full max-w-xs items-center justify-center rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800">
            {src ? <><img src={src} alt="QR code" className="h-full w-full" /><span className="sr-only">QR code ready for {payload.length} characters</span></> : <span className="text-sm text-slate-500">QR code appears here.</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn" disabled={!svg} onClick={() => downloadBytes(new TextEncoder().encode(svg), 'qr-code.svg', 'image/svg+xml')}>Download SVG</button>
            <select aria-label="PNG size" className="select" value={s.size} onChange={(e) => set({ size: Number(e.target.value) })}>{[256, 512, 1024, 2048].map((n) => <option key={n} value={n}>{n}px</option>)}</select>
            <button type="button" className="btn" disabled={!svg} onClick={() => void downloadPng()}>Download PNG</button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
