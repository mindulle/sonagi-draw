import fs from "node:fs";
import path from "node:path";
import LZString from "lz-string";
import { convertExcalidrawToTldraw } from "./convert-excalidraw";

const WIKI_DIR = "/home/ubuntu/llm-wiki";
const DEST_DIR = "/home/ubuntu/llm-wiki/03_Resources/Drawings";

fs.mkdirSync(DEST_DIR, { recursive: true });

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file.startsWith(".") || file.includes("04_Archives") || file === "node_modules") continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (file.endsWith(".excalidraw") || file.endsWith(".excalidraw.md")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function parseExcalidrawFile(filePath: string): any[] | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    if (filePath.endsWith(".excalidraw")) {
      const data = JSON.parse(content);
      return data.elements || [];
    }

    // .excalidraw.md
    if (content.includes("```compressed-json")) {
      const match = content.match(/```compressed-json\s+([\s\S]*?)```/);
      if (match && match[1]) {
        const compressed = match[1].replace(/\s+/g, "");
        const decompressed = LZString.decompressFromBase64(compressed);
        if (decompressed) {
          const data = JSON.parse(decompressed);
          return data.elements || [];
        }
      }
    }

    if (content.includes("```json")) {
      const match = content.match(/```json\s+([\s\S]*?)```/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        return data.elements || [];
      }
    }

    return null;
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    return null;
  }
}

async function main() {
  const files = getAllFiles(WIKI_DIR);
  console.log(`Found ${files.length} Excalidraw files to migrate.`);

  let successCount = 0;
  for (const file of files) {
    const baseName = path.basename(file)
      .replace(/\.excalidraw\.md$/, "")
      .replace(/\.excalidraw$/, "");

    const elements = parseExcalidrawFile(file);
    if (!elements || elements.length === 0) {
      console.log(`Skipping (no elements): ${baseName}`);
      continue;
    }

    const tldrawDoc = convertExcalidrawToTldraw(elements);
    const destPath = path.join(DEST_DIR, `${baseName}.tldr`);
    fs.writeFileSync(destPath, JSON.stringify(tldrawDoc, null, 2), "utf-8");

    // Also write a copy right next to the original file for local wikilink convenience
    const localDestPath = path.join(path.dirname(file), `${baseName}.tldr`);
    fs.writeFileSync(localDestPath, JSON.stringify(tldrawDoc, null, 2), "utf-8");

    console.log(`✓ Converted: ${baseName} (${elements.length} elements ➔ ${Object.keys(tldrawDoc.store).length} records)`);
    successCount++;
  }

  console.log(`\n🎉 Migration Complete: ${successCount} / ${files.length} files successfully converted to .tldr!`);
  process.exit(0);
}

main().catch(console.error);
