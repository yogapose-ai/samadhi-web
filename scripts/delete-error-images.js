// Usage: node scripts/delete-error-images.js [path-to-list]
// Default list path: errorimages.txt (project root)

import fs from 'fs';
import path from 'path';

function readLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

function toAbsolutePublicPath(relFromPublic) {
  const projectRoot = process.cwd();
  const cleaned = relFromPublic.replace(/^\/+/, '');
  return path.join(projectRoot, 'public', cleaned);
}

function main() {
  const listArg = process.argv[2] || 'errorimages.txt';
  const listPath = path.isAbsolute(listArg)
    ? listArg
    : path.join(process.cwd(), listArg);

  if (!fs.existsSync(listPath)) {
    cnsole.error(`List file not found: ${listPath}`);
    process.exit(1);
  }

  const lines = readLines(listPath);
  if (lines.length === 0) {
    console.log('No paths found in list. Nothing to delete.');
    return;
  }

  let deleted = 0;
  let missing = 0;
  for (const rel of lines) {
    // path in list starts with "/archive/...", which is relative to public/
    const abs = toAbsolutePublicPath(rel);
    try {
      if (fs.existsSync(abs)) {
        fs.unlinkSync(abs);
        console.log(`Deleted: ${abs}`);
        deleted++;
      } else {
        console.warn(`Missing: ${abs}`);
        missing++;
      }
    } catch (e) {
      console.error(`Failed to delete ${abs}:`, e.message);
    }
  }

  console.log(
    `\nSummary -> Deleted: ${deleted}, Missing: ${missing}, Total: ${lines.length}`
  );
}

main();
