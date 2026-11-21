// Applies the theme before first paint (external file: CSP forbids inline scripts).
(function () {
  var t = null;
  try { t = JSON.parse(localStorage.getItem('devkit:theme')); } catch (e) {}
  if (t !== 'dark' && t !== 'light') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.classList.toggle('dark', t === 'dark');
})();
