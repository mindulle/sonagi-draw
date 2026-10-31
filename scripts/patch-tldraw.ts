import fs from 'node:fs';
import path from 'node:path';

function patchFile(filePath: string, search: string | RegExp, replacement: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (typeof search === 'string' ? content.includes(search) : search.test(content)) {
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Patch] Applied to ${path.basename(filePath)}`);
  }
}

// Target all @tldraw/editor installations
const globPatterns = [
  '/home/ubuntu/sonagi-draw/node_modules/.pnpm/@tldraw+editor@5.6.0_@floating-ui+dom@1.8.0_@types+react-dom@18.3.7_@types+react@18.3.3_5a4a4a7a40ccda56b615d16435dece70/node_modules/@tldraw/editor',
  '/home/ubuntu/sonagi-draw/node_modules/.pnpm/@tldraw+editor@5.3.0_@floating-ui+dom@1.8.0_@types+react-dom@18.3.7_@types+react@18.3.3_0abf22e4c8e636413c36b278610e1497/node_modules/@tldraw/editor'
];

for (const dir of globPatterns) {
  if (!fs.existsSync(dir)) continue;

  const mjsManager = path.join(dir, 'dist-esm/lib/license/LicenseManager.mjs');
  const jsManager = path.join(dir, 'dist-cjs/lib/license/LicenseManager.js');
  const mjsProvider = path.join(dir, 'dist-esm/lib/license/LicenseProvider.mjs');
  const jsProvider = path.join(dir, 'dist-cjs/lib/license/LicenseProvider.js');

  // 1. Domain validation bypass for Discord Activity sandboxes & Sonagi domains
  const domainBypass = `isDomainValid(licenseInfo) {
    if (typeof window !== "undefined" && (window.location.hostname.includes("discordsays.com") || window.location.hostname.includes("sonagi.space") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) return true;`;

  patchFile(mjsManager, 'isDomainValid(licenseInfo) {', domainBypass);
  patchFile(jsManager, 'isDomainValid(licenseInfo) {', domainBypass);

  // 2. Relative watermark track URL so sandboxed Discord webviews do not trigger failed fetch to cdn.tldraw.com
  patchFile(mjsManager, /const WATERMARK_TRACK_SRC = `\${[^}]+}\/watermarks\/watermark-track\.svg`;/, 'const WATERMARK_TRACK_SRC = `/watermarks/watermark-track.svg`;');
  patchFile(jsManager, /const WATERMARK_TRACK_SRC = `\${[^}]+}\/watermarks\/watermark-track\.svg`;/, 'const WATERMARK_TRACK_SRC = `/watermarks/watermark-track.svg`;');

  // 3. Prevent blackout/gate unmounting editor after 5 seconds
  patchFile(mjsProvider, /function shouldHideEditorAfterDelay\([^)]*\)\s*\{[^}]*\}/, 'function shouldHideEditorAfterDelay() { return false; }');
  patchFile(jsProvider, /function shouldHideEditorAfterDelay\([^)]*\)\s*\{[^}]*\}/, 'function shouldHideEditorAfterDelay() { return false; }');
}

console.log('[Tldraw Patch] Completed successfully.');
