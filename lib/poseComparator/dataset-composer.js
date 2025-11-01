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

const stratifiedSample = (cats, pairs, sampleSize) => {
  // 균형 샘플링 설정
  const sampledPairs = [];
  pairs = pairs.filter((p) => p.image1.path !== p.image2.path); // 동일 이미지 제거

  const samePairs = pairs.filter((p) => p.isSame === 1);
  const diffPairs = pairs.filter((p) => p.isSame === 0);

  // 유틸: 무작위 샘플
  const getRandomSamples = (arr, count) => {
    if (count <= 0) return [];
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };

  // 1) same 페어: 카테고리별 균형 샘플링
  const sameByCategory = {};
  for (const c of cats) sameByCategory[c] = [];
  for (const p of samePairs) {
    // 같은 카테고리 페어이므로 둘 중 하나 사용
    sameByCategory[p.image1.poseAnswer]?.push(p);
  }
  const sameTotalTarget = Math.min(
    Math.floor(sampleSize / 2),
    samePairs.length
  );
  const perCatBase = Math.max(
    1,
    Math.floor(sameTotalTarget / Math.max(1, cats.length))
  );

  let sameSelected = [];
  let allocated = 0;
  // 1차: 카테고리별 base 할당
  for (const c of cats) {
    const take = Math.min(perCatBase, sameByCategory[c]?.length || 0);
    if (take > 0) {
      const picked = getRandomSamples(sameByCategory[c], take);
      sameSelected.push(...picked);
      allocated += picked.length;
    }
  }
  // 2차: 남은 수를 라운드로빈으로 보충
  let remaining = sameTotalTarget - allocated;
  if (remaining > 0) {
    const pools = cats.map((c) => ({
      c,
      pool: sameByCategory[c].filter((p) => !sameSelected.includes(p)),
    }));
    let idx = 0;
    while (remaining > 0 && pools.some((x) => x.pool.length > 0)) {
      const cur = pools[idx % pools.length];
      if (cur.pool.length > 0) {
        sameSelected.push(cur.pool.pop());
        remaining--;
      }
      idx++;
    }
  }

  // 2) diff 페어: 카테고리 조합별 균형 샘플링 (총량 = sameSelected와 동일)
  const diffByCatPair = {};
  for (let a = 0; a < cats.length; a++) {
    for (let b = a + 1; b < cats.length; b++) {
      const key = `${cats[a]}|${cats[b]}`;
      diffByCatPair[key] = [];
    }
  }
  for (const p of diffPairs) {
    const [ca, cb] = [p.image1.poseAnswer, p.image2.poseAnswer].sort();
    const key = `${ca}|${cb}`;
    if (!diffByCatPair[key]) diffByCatPair[key] = [];
    diffByCatPair[key].push(p);
  }
  const catPairKeys = Object.keys(diffByCatPair);
  const diffTotalTarget = Math.min(sameSelected.length, diffPairs.length);
  const perPairBase = Math.max(
    1,
    Math.floor(diffTotalTarget / Math.max(1, catPairKeys.length))
  );

  let diffSelected = [];
  let diffAllocated = 0;
  for (const key of catPairKeys) {
    const pool = diffByCatPair[key] || [];
    const take = Math.min(perPairBase, pool.length);
    if (take > 0) {
      const picked = getRandomSamples(pool, take);
      diffSelected.push(...picked);
      diffAllocated += picked.length;
    }
  }
  let diffRemaining = diffTotalTarget - diffAllocated;
  if (diffRemaining > 0) {
    const pools = catPairKeys.map((k) => ({
      k,
      pool: diffByCatPair[k].filter((p) => !diffSelected.includes(p)),
    }));
    let idx = 0;
    while (diffRemaining > 0 && pools.some((x) => x.pool.length > 0)) {
      const cur = pools[idx % pools.length];
      if (cur.pool.length > 0) {
        diffSelected.push(cur.pool.pop());
        diffRemaining--;
      }
      idx++;
    }
  }

  // 합치고 셔플
  sampledPairs.push(...sameSelected, ...diffSelected);
  // 최종 안전 셔플
  for (let i = sampledPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sampledPairs[i], sampledPairs[j]] = [sampledPairs[j], sampledPairs[i]];
  }

  return sampledPairs;
};

const filterByTargetPose = (targetPose, pairs, sampleSize) => {
  const sampledPairs = [];
  pairs = pairs.filter((p) => p.image1.path !== p.image2.path); // 동일 이미지 제거
  pairs = pairs.filter(
    (p) =>
      p.image1.poseAnswer == targetPose || p.image2.poseAnswer == targetPose
  ); // downdog 포함 페어만
  const samePairs = pairs.filter((p) => p.isSame === 1);
  const diffPairs = pairs.filter((p) => p.isSame === 0);
  const sameSampleCount = Math.min(
    Math.floor(sampleSize / 2),
    samePairs.length
  );
  const diffSampleCount = Math.min(
    sampleSize - sameSampleCount,
    diffPairs.length
  );
  const getRandomSamples = (arr, count) => {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  sampledPairs.push(...getRandomSamples(samePairs, sameSampleCount));
  sampledPairs.push(...getRandomSamples(diffPairs, diffSampleCount));
  sampledPairs.sort(() => 0.5 - Math.random()); // 섞기
  return sampledPairs;
};

export const ComposeDatasetJson = ({
  datasetPath,
  outputFileName,
  sampleSize,
  isStratifiedSampled,
  isSelectTargetPose,
  targetPose,
}) => {
  const datasetDir = path.join(process.cwd(), datasetPath);
  const outputFilePath = path.join(
    process.cwd(),
    '/public/dataset',
    outputFileName
  );
  console.log(outputFilePath);

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
      const n = 10000;
      for (let k = 0; k < Math.min(A.length, n); k++) {
        for (let m = 0; m < Math.min(B.length, n); m++) {
          const fa = A[k];
          const fb = B[m];
          if (!fa || !fb) continue;
          pairs.push({
            image1: { poseAnswer: ca, path: toPublicWebPath(fa) },
            image2: { poseAnswer: cb, path: toPublicWebPath(fb) },
            isSame: 0,
          });
        }
      }
    }
  }
  console.log(`Total pairs before sampling: ${pairs.length}`);

  const sampledPairs = isStratifiedSampled
    ? stratifiedSample(cats, pairs, sampleSize)
    : isSelectTargetPose
    ? filterByTargetPose(targetPose, pairs, sampleSize)
    : pairs;

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

const DATASET_PATH = '/public/archive/DATASET/TEST';
ComposeDatasetJson({
  datasetPath: DATASET_PATH,
  outputFileName: 'dataset_test_balanced_6000.json',
  sampleSize: 6000, // 뽑을 이미지쌍 개수. isStratifiedSampled나 isSelectTargetPose가 true일 때만 유효
  isStratifiedSampled: true, // 균형 샘플링 여부
  isSelectTargetPose: false, // 특정 자세만 선택할지 여부. isStratifiedSampled가 false일 때만 유효
  targetPose: 'warrior2',
});
