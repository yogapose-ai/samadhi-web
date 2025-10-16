import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);

function collectImagesRecursively(dirAbsPath: string, basePublicAbsPath: string, results: string[]) {
  const entries = fs.readdirSync(dirAbsPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryAbsPath = path.join(dirAbsPath, entry.name);
    if (entry.isDirectory()) {
      collectImagesRecursively(entryAbsPath, basePublicAbsPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const relFromPublic = path.relative(basePublicAbsPath, entryAbsPath).split(path.sep).join('/');
        results.push('/' + relFromPublic);
      }
    }
  }
}

export async function GET() {
  try {
    const publicAbsPath = path.join(process.cwd(), 'public');
    const datasetAbsPath = path.join(publicAbsPath, 'archive', 'DATASET');

    if (!fs.existsSync(datasetAbsPath)) {
      return NextResponse.json({ images: [], error: 'DATASET directory not found' }, { status: 200 });
    }

    const images: string[] = [];
    collectImagesRecursively(datasetAbsPath, publicAbsPath, images);
    return NextResponse.json({ images }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ images: [], error: error ?? 'Unknown error' }, { status: 500 });
  }
}


