import { Link } from 'react-router-dom';
import { catalog } from '@/lib/llm';
import { tools } from '@/lib/registry';
import { SITE_NAME, useDocumentMeta } from '@/lib/useDocumentMeta';
import { Prose } from './Prose';

export default function About() {
  useDocumentMeta(`About — ${SITE_NAME}`, 'About devkit-local, an offline-capable developer toolbox for AI engineers.');
  return (
    <Prose>
      <h1>About</h1>
      <p>
        {SITE_NAME} is a toolbox for developers who build with LLMs. Alongside everyday tools for JWTs, JSON, regex and
        timestamps, it has tools most toolbox sites don’t: token counting across providers, cost comparison and
        context-window fit.
      </p>
      <ul>
        <li><strong>Private:</strong> everything runs in your browser. See <Link to="/privacy">Privacy</Link>.</li>
        <li><strong>Fast:</strong> each tool loads only when you open it; heavy work runs in Web Workers.</li>
        <li><strong>Offline:</strong> install it as an app, or just revisit — it works without a connection after the first visit.</li>
        <li><strong>Keyboard-first:</strong> press <kbd className="kbd">Ctrl/⌘ K</kbd> to jump to any tool, <kbd className="kbd">?</kbd> for all shortcuts.</li>
      </ul>
      <p>
        {tools.length} tools so far. Model prices were last updated on <strong>{catalog.lastUpdated}</strong>; always confirm
        against the providers’ official pricing pages before making budget decisions.
      </p>
    </Prose>
  );
}
