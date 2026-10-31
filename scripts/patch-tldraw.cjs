const fs = require('fs');
const path = require('path');

function patchFile(filePath, search, replacement) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (typeof search === 'string' ? content.includes(search) : search.test(content)) {
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Patch] Applied to ${path.basename(filePath)}`);
  }
}

// Dynamically locate all @tldraw/editor installations in node_modules/.pnpm
const rootDir = path.resolve(__dirname, '..');
const pnpmDir = path.join(rootDir, 'node_modules/.pnpm');
const targetDirs = [];

if (fs.existsSync(pnpmDir)) {
  for (const name of fs.readdirSync(pnpmDir)) {
    if (name.startsWith('@tldraw+editor@')) {
      const target = path.join(pnpmDir, name, 'node_modules/@tldraw/editor');
      if (fs.existsSync(target)) targetDirs.push(target);
    }
  }
}

// Fallback for direct node_modules/@tldraw/editor if present
const directEditor = path.join(rootDir, 'node_modules/@tldraw/editor');
if (fs.existsSync(directEditor) && !targetDirs.includes(directEditor)) {
  targetDirs.push(directEditor);
}

for (const dir of targetDirs) {
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
