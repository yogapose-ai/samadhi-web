import fs from 'fs';
import path from 'path';

// 명령어
// node lib/poseComparator/dataset-composer.js

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
]);

const listImageFiles = (dir) => {
  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => path.join(dir, file));
};

const toPublicWebPath = (absolutePath) => {
  const parts = absolutePath.split(path.sep);
  const idx = parts.lastIndexOf('public');
  if (idx >= 0) {
    const rel = parts.slice(idx + 1).join('/');
    return '/' + rel;
  }
  // fallback: return file name only when public root not found
  return '/' + path.basename(absolutePath);
};

export const ComposeDatasetJson = (datasetPath) => {
  const targetPose = 'goddess'; // 타겟 포즈가 포함된 페어만 선택
  const datasetDir = path.join(process.cwd(), datasetPath);
  const outputFilePath = path.join(
    process.cwd(),
    `/public/dataset/dataset_${targetPose}.json`
  );

  if (!fs.existsSync(datasetDir) || !fs.statSync(datasetDir).isDirectory()) {
    throw new Error(`Invalid dataset directory: ${datasetDir}`);
  }

  const categories = fs
    .readdirSync(datasetDir)
    .filter((file) => fs.statSync(path.join(datasetDir, file)).isDirectory());

  const categoryToFiles = {};
  for (const category of categories) {
    const categoryPath = path.join(datasetDir, category);
    const files = listImageFiles(categoryPath);
    if (files.length > 0) {
      categoryToFiles[category] = files;
    }
  }

  let pairs = [];

  // Same-category pairs (unique pairs i<j)
  for (const category of Object.keys(categoryToFiles)) {
    const files = categoryToFiles[category];
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        pairs.push({
          image1: { poseAnswer: category, path: toPublicWebPath(files[i]) },
          image2: { poseAnswer: category, path: toPublicWebPath(files[j]) },
          isSame: 1,
        });
      }
    }
  }

  // Different-category pairs (zip by index to avoid combinatorial explosion)
  const cats = Object.keys(categoryToFiles);
  for (let a = 0; a < cats.length; a++) {
    for (let b = a + 1; b < cats.length; b++) {
      const ca = cats[a];
      const cb = cats[b];
      const A = categoryToFiles[ca] ?? [];
      const B = categoryToFiles[cb] ?? [];
      const n = Math.max(A.length, B.length);
      if (n === 0) continue;
      for (let k = 0; k < n; k++) {
        const fa = A[k % A.length];
        const fb = B[k % B.length];
        if (!fa || !fb) continue;
        pairs.push({
          image1: { poseAnswer: ca, path: toPublicWebPath(fa) },
          image2: { poseAnswer: cb, path: toPublicWebPath(fb) },
          isSame: 0,
        });
      }
    }
  }

  // files에서 stratified random sampling 100개 (또는 그 이하)
  const SAMPLE_LIMIT = 1000;
  const sampledPairs = [];
  pairs = pairs.filter((p) => p.image1.path !== p.image2.path); // 동일 이미지 제거
  pairs = pairs.filter(
    (p) =>
      p.image1.poseAnswer == targetPose || p.image2.poseAnswer == targetPose
  ); // downdog 포함 페어만
  const samePairs = pairs.filter((p) => p.isSame === 1);
  const diffPairs = pairs.filter((p) => p.isSame === 0);
  const sameSampleCount = Math.min(
    Math.floor(SAMPLE_LIMIT / 2),
    samePairs.length
  );
  const diffSampleCount = Math.min(
    SAMPLE_LIMIT - sameSampleCount,
    diffPairs.length
  );
  const getRandomSamples = (arr, count) => {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  sampledPairs.push(...getRandomSamples(samePairs, sameSampleCount));
  sampledPairs.push(...getRandomSamples(diffPairs, diffSampleCount));
  sampledPairs.sort(() => 0.5 - Math.random()); // 섞기

  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(sampledPairs, null, 2),
    'utf-8'
  );
  console.log(
    `Dataset JSON composed at: ${outputFilePath} (pairs: ${sampledPairs.length})`
  );
  return sampledPairs;
};

const DATASET_PATH = '/public/archive/DATASET/TRAIN';
ComposeDatasetJson(DATASET_PATH);
