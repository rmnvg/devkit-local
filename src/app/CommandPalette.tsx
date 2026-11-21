import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { tools } from '@/lib/registry';
import { CATEGORIES } from '@/lib/types';
import { useTheme } from './theme';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="cmdk-dialog"
      overlayClassName="cmdk-overlay"
    >
      <Command.Input placeholder="Search tools…" className="cmdk-input" />
      <Command.List className="cmdk-list">
        <Command.Empty className="px-3 py-6 text-center text-sm text-slate-500">No tools found.</Command.Empty>
        {CATEGORIES.map((c) => {
          const items = tools.filter((t) => t.category === c.id);
          if (!items.length) return null;
          return (
            <Command.Group key={c.id} heading={c.label}>
              {items.map((t) => (
                <Command.Item
                  key={t.slug}
                  value={t.name}
                  keywords={[t.slug, ...t.keywords]}
                  onSelect={() => go(`/tools/${t.slug}`)}
                  className="cmdk-item"
                >
                  <span>{t.name}</span>
                  <span className="truncate text-xs text-slate-500">{t.description}</span>
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}
        <Command.Group heading="General">
          <Command.Item value="Home" onSelect={() => go('/')} className="cmdk-item">Home</Command.Item>
          <Command.Item value="Toggle theme" keywords={['dark', 'light']} onSelect={() => { toggle(); onOpenChange(false); }} className="cmdk-item">
            Toggle dark / light theme
          </Command.Item>
          <Command.Item value="Privacy" onSelect={() => go('/privacy')} className="cmdk-item">Privacy</Command.Item>
          <Command.Item value="About" onSelect={() => go('/about')} className="cmdk-item">About</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
