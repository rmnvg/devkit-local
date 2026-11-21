import headers from '../../config/security-headers.json';
import { SITE_NAME, useDocumentMeta } from '@/lib/useDocumentMeta';
import { Prose } from './Prose';

export default function Privacy() {
  useDocumentMeta(`Privacy — ${SITE_NAME}`, 'How devkit-local keeps your data private: everything runs in your browser, enforced by a strict Content-Security-Policy.');
  const csp = headers['Content-Security-Policy'];
  return (
    <Prose>
      <h1>Privacy</h1>
      <p>
        <strong>Short version: nothing you type or paste into these tools leaves your browser.</strong> There is no
        backend, no account, no analytics and no third-party scripts.
      </p>
      <h2>How that is enforced</h2>
      <ul>
        <li>
          Every tool runs as JavaScript on this page or in a Web Worker on this page. Tokenizers, JSON parsers, JWT
          verification and everything else are bundled with the site.
        </li>
        <li>
          The site is served with a <strong>Content-Security-Policy</strong> that tells your browser to refuse network
          connections to any other origin (<code>connect-src 'self'</code>) and to run only scripts from this site. Even
          if a bug or a compromised dependency tried to send your data somewhere, the browser would block it.
        </li>
        <li>Fonts and icons are self-hosted, so loading the page doesn’t contact Google Fonts or a CDN.</li>
        <li>
          Share links store tool state in the part of the URL after <code>#</code>. Browsers never send that part to a
          server. Tools that handle secrets (like the JWT decoder) leave inputs out of share links unless you tick
          “Include input”.
        </li>
      </ul>
      <p>You can check this yourself: open your browser’s DevTools, go to the Network tab, and use any tool.</p>
      <h2>The exact policy</h2>
      <pre className="code-box whitespace-pre-wrap break-words">{csp.split('; ').join(';\n')}</pre>
      <h2>What is stored on your device</h2>
      <ul>
        <li>Your theme, favorites, recently used tools and per-tool settings (like the selected model) in <code>localStorage</code>.</li>
        <li>
          Tool <em>inputs</em> are stored only if you turn on “Remember inputs” in the sidebar. It is off by default, and
          turning it off deletes anything saved.
        </li>
        <li>The app itself is cached by a service worker so it works offline.</li>
      </ul>
      <h2>Model prices</h2>
      <p>
        The LLM cost and context tools use a price list bundled with the site. They never call provider APIs, which is
        also why Claude and Gemini token counts are marked as estimates.
      </p>
    </Prose>
  );
}
