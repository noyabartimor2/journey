// Builds two things:
//   dist/index.html  -> the design preview (sample content), published as an artifact
//   site/            -> the real app (connected to Supabase), ready to put online
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';

const esbuild = '/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/bin/esbuild';
const css = readFileSync('src/styles.css', 'utf8');
const REACT = `<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600&family=Frank+Ruhl+Libre:wght@300;400;500&display=swap">`;

function bundle(entry, out) {
  execFileSync(esbuild, [
    entry, '--bundle', '--format=iife', '--target=es2019', '--minify',
    '--jsx-factory=React.createElement', '--jsx-fragment=React.Fragment',
    `--outfile=${out}`, '--log-level=warning',
  ], { stdio: 'inherit' });
  return readFileSync(out, 'utf8').replace(/<\/script/gi, '<\\/script');
}

// 1. Preview
mkdirSync('dist', { recursive: true });
const previewJs = bundle('src/main-preview.jsx', 'dist/app.js');
const preview = `<title>לשגשג בחוסר בהירות</title>
<meta name="theme-color" content="#FAF7F2">
${FONTS}
<style>
${css}
</style>
<div id="root" dir="rtl" lang="he"></div>
${REACT}
<script>
${previewJs}
</script>
`;
writeFileSync('dist/index.html', preview);

// 2. Real site
mkdirSync('site', { recursive: true });
const siteJs = bundle('src/main-site.jsx', 'site/app.js');
writeFileSync('site/styles.css', css);
const stamp = Date.now().toString(36);
const site = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>JOURNEY</title>
<meta name="description" content="מחרדה לשגשוג בתוך אי־ודאות ב־9 ימים">
<meta name="theme-color" content="#FAF7F2">
<meta name="robots" content="noindex">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="JOURNEY">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
${FONTS}
<link rel="stylesheet" href="styles.css?v=${stamp}">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
</head>
<body>
<div id="root" dir="rtl" lang="he"></div>
<noscript>כדי להשתמש ב־JOURNEY צריך לאפשר JavaScript בדפדפן.</noscript>
${REACT}
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="app.js?v=${stamp}"></script>
</body>
</html>
`;
writeFileSync('site/index.html', site);
writeFileSync('site/manifest.webmanifest', JSON.stringify({
  name: 'JOURNEY', short_name: 'JOURNEY', lang: 'he', dir: 'rtl',
  start_url: './', display: 'standalone', background_color: '#FAF7F2', theme_color: '#FAF7F2',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));
for (const f of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
  if (existsSync(`assets/${f}`)) copyFileSync(`assets/${f}`, `site/${f}`);
}
console.log('Built dist/index.html (preview) and site/ (real app)');
