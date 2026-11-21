import { copyText } from '@/lib/clipboard';
import { useToast } from './Toast';

export function useCopy() {
  const toast = useToast();
  return async (text: string, label = 'Copied') => {
    if (!text) return;
    const ok = await copyText(text);
    toast(ok ? label : 'Copy failed — select and copy manually');
  };
}

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <button
      type="button"
      className={`btn btn-sm ${className}`}
      disabled={!text}
      onClick={() => void copy(text)}
    >
      {label}
    </button>
  );
}
