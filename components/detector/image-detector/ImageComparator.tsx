'use client';

import { useState } from 'react';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import {
  calculateAllAngles,
  CalculateSimilarity,
  SimilarityResult,
  vectorize,
} from '@/lib/medaipipe/angle-calculator';
import { JointAngles } from '@/types/pose';
import classifyPose from '@/lib/poseClassifier/pose-classifier';
import { Button } from '@/components/ui/button';

const SAMPLE_IMAGES = [
  {
    image1: {
      name: 'downdog',
      path: '/images/downdog.png',
    },
    image2: {
      name: 'plank',
      path: '/images/plank.jpg',
    },
    isSame: 0,
  },
];

interface ImageComparatorOutput {
  image1: {
    name: string;
    angles: JointAngles;
    poseName: string;
    distPerPose: Record<string, number>;
  };
  image2: {
    name: string;
    angles: JointAngles;
    poseName: string;
    distPerPose: Record<string, number>;
  };
  similarity: SimilarityResult | null;
  isSameAnswer: number;
  isSameResult: number;
}
export default function ImageComparator() {
  const { imageLandmarker, isInitialized } = useMediaPipe();
  const [results, setResults] = useState<ImageComparatorOutput[]>([]);

  const createImageFromPath = (path: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));

      img.src = path;
    });
  };

  const handleSampleSelect = async () => {
    const result = [];
    for (let i = 0; i < SAMPLE_IMAGES.length; i++) {
      const image1 = await createImageFromPath(SAMPLE_IMAGES[i].image1.path);
      const image2 = await createImageFromPath(SAMPLE_IMAGES[i].image2.path);

      if (!isInitialized || !imageLandmarker || !image1 || !image2) return;
      const detectResults1 = imageLandmarker.detect(image1);
      const detectResults2 = imageLandmarker.detect(image2);

      if (
        !detectResults1 ||
        !detectResults2 ||
        !detectResults1.landmarks ||
        !detectResults2.landmarks
      )
        return;
      const landmarks1 = detectResults1.landmarks[0];
      const landmarks2 = detectResults2.landmarks[0];
      const worldLandmarks1 = detectResults1.worldLandmarks?.[0];
      const worldLandmarks2 = detectResults2.worldLandmarks?.[0];

      if (!worldLandmarks1 || !worldLandmarks2) return;
      const angles1 = calculateAllAngles(worldLandmarks1, {}, () => {});
      const angles2 = calculateAllAngles(worldLandmarks2, {}, () => {});

      if (!landmarks1 || !landmarks2) return;
      const data1 = vectorize(
        landmarks1,
        image1.naturalHeight,
        image1.naturalWidth
      );
      const data2 = vectorize(
        landmarks2,
        image2.naturalHeight,
        image2.naturalWidth
      );

      URL.revokeObjectURL(image1.src);
      URL.revokeObjectURL(image2.src);

      // pose classification
      const poseResult1 = classifyPose(angles1);
      const poseResult2 = classifyPose(angles2);

      // similarity calculation
      const similarity = CalculateSimilarity(data1, data2);

      result.push({
        image1: {
          name: SAMPLE_IMAGES[i].image1.name,
          angles: angles1,
          poseName: poseResult1.bestPose,
          distPerPose: poseResult1.distPerPose,
        },
        image2: {
          name: SAMPLE_IMAGES[i].image2.name,
          angles: angles2,
          poseName: poseResult2.bestPose,
          distPerPose: poseResult2.distPerPose,
        },
        similarity: similarity,
        isSameAnswer: SAMPLE_IMAGES[i].isSame,
        isSameResult: poseResult1.bestPose === poseResult2.bestPose ? 1 : 0,
      });
    }

    setResults(result);
  };

  return (
    <div className='w-full space-y-4'>
      <Button
        onClick={handleSampleSelect}
        disabled={!isInitialized}
        size='default'
        className='gap-2 h-9 text-sm w-auto px-5'
        variant='outline'
      >
        {' '}
        이미지 비교하기
      </Button>

      <div className='space-y-8'>
        <pre className='p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 overflow-y-auto whitespace-pre-wrap text-left font-mono text-xs'>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
}
