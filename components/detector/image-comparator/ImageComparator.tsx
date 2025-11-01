'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMediaPipe } from '@/hooks/useMediaPipe';

import { Button } from '@/components/ui/button';
import {
  toFlatRows,
  saveAsCSV,
  saveAsJSON,
} from '@/lib/poseComparator/grid-composer';
import {
  calculatePoseAndSimilarity,
  ImagePair,
  PoseAndSimilarityResult,
} from '@/lib/poseComparator/pose-comparator';
import {
  calculateThresholdAccuracy,
  ThresholdAccuracy,
} from '@/lib/poseComparator/accuracy-calculator';
import AccuracyPerLambdaDisplay from './ui/AccuracyPerLambdaDisplay';
import { Input } from '@/components/ui/input';
import { BestAccuracyDisplay } from './ui/BestAccuracyDisplay';

const SAMPLE_IMAGES = [
  {
    image1: {
      poseAnswer: 'plank',
      path: '/images/plank.jpg',
    },
    image2: {
      poseAnswer: 'plank',
      path: '/images/plank2.jpg',
    },
    isSame: 1,
  },
];

export default function ImageComparator() {
  const { imageLandmarker, isInitialized } = useMediaPipe();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageList, setImageList] = useState<ImagePair[]>(SAMPLE_IMAGES);
  const [poseAndSimilarityResult, setposeAndSimilarityResult] = useState<
    PoseAndSimilarityResult[]
  >([]);
  const [accuracyPerLambda, setAccuracyPerLambda] = useState<
    Map<number, ThresholdAccuracy[]>
  >(new Map());
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [inputlambda, setInputLambda] = useState<number>(1.0);
  const [inputThreshold, setInputThreshold] = useState<number>(100);

  const lambdas = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const datasetUrl = '/dataset/dataset_test_balanced_12000.json';

  useEffect(() => {
    // public 폴더의 파일은 절대 경로로 바로 fetch 할 수 있습니다.
    fetch(datasetUrl)
      .then((response) => response.json())
      .then((data: ImagePair[]) => {
        setImageList(data);
      })
      .catch((error) => {
        alert(`설정 파일을 불러오는 데 실패했습니다: ${error}`);
      });
  }, []); // 빈 배열을 전달하여 최초 렌더링 시에만 실행

  const compareImages = useCallback(async () => {
    if (!isInitialized || !imageLandmarker) return;
    setIsLoading(true);

    // 이미지 쌍에 대해 포즈 분류 및 유사도 계산
    const result = await calculatePoseAndSimilarity({
      imageList: imageList,
      imageLandmarker,
      onProgress: (processed) => setProcessedCount(processed),
    });
    setposeAndSimilarityResult(result);

    // 람다별 정확도 계산
    const accuracyMap: Map<number, ThresholdAccuracy[]> = new Map();
    for (const lambda of lambdas) {
      const thresholdAccuracies = calculateThresholdAccuracy(result, lambda);
      accuracyMap.set(lambda, thresholdAccuracies);
    }
    setAccuracyPerLambda(accuracyMap);
    setIsLoading(false);
  }, [isInitialized, imageLandmarker, imageList]);

  return (
    <div className='w-full space-y-4'>
      <h2 className='text-xl font-normal'>
        프로젝트 폴더에서 아래 명령어로 이미지쌍 데이터셋 파일을 생성 후
        이미지를 비교해주세요!
      </h2>
      <h2 className='text-xl font-normal'>
        현재 데이터셋 파일: <code>{datasetUrl}</code>
      </h2>
      <pre className='bg-gray-100 p-4 rounded text-sm overflow-x-auto'>
        node lib/poseComparator/dataset-composer.js
      </pre>
      <div className='gap-2 text-sm'>
        <Button
          onClick={compareImages}
          disabled={!isInitialized}
          size='default'
          className='gap-2 h-9 text-sm w-auto px-5'
          variant='outline'
        >
          이미지 비교하기
        </Button>
      </div>
      {isLoading && (
        <div className='text-sm'>
          이미지 비교 진행 중... ({processedCount}/{imageList.length})
        </div>
      )}

      {!isLoading && poseAndSimilarityResult.length > 0 && (
        <div className='space-y-6'>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                saveAsCSV(
                  poseAndSimilarityResult,
                  accuracyPerLambda.get(inputlambda)![inputThreshold]
                )
              }
            >
              CSV 저장
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => saveAsJSON(poseAndSimilarityResult)}
            >
              JSON 저장
            </Button>
          </div>
          {/* 람다별 정확도 분석 결과 */}
          <AccuracyPerLambdaDisplay
            lambdas={lambdas}
            accuracyPerLambda={accuracyPerLambda}
          />
          <h3 className='text-lg font-semibold'>특정 람다 & 임계값 결과</h3>
          람다 선택
          <Input
            type='number'
            value={inputlambda}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputLambda(parseFloat(e.target.value))
            }
            step='0.2'
            min='0'
            max='1'
            className='w-20 border rounded px-2 py-1'
          />
          임계값 선택
          <Input
            type='number'
            value={inputThreshold}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputThreshold(parseInt(e.target.value))
            }
            step='1'
            min='0'
            max='100'
            className='w-20 border rounded px-2 py-1'
          />
          <BestAccuracyDisplay
            lambda={inputlambda}
            bestThreshold={accuracyPerLambda.get(inputlambda)![inputThreshold]}
          />
          {/* 상세 결과 테이블 */}
          {/* <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>상세 결과</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-xs text-left border border-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-3 py-2 border'>이미지1 포즈정답</th>
                    <th className='px-3 py-2 border'>이미지1 포즈예측</th>
                    <th className='px-3 py-2 border'>이미지2 포즈정답</th>
                    <th className='px-3 py-2 border'>이미지2 포즈예측</th>
                    <th className='px-3 py-2 border'>cosine 유사도(원본)</th>
                    <th className='px-3 py-2 border'>euclid 유사도(원본)</th>
                    <th className='px-3 py-2 border'>
                      cosine 유사도(좌우반전)
                    </th>
                    <th className='px-3 py-2 border'>
                      euclid 유사도(좌우반전)
                    </th>

                    <th className='px-3 py-2 border'>일치 정답</th>
                  </tr>
                </thead>
                <tbody>
                  {toFlatRows(
                    poseAndSimilarityResult,
                    accuracyPerLambda.get(inputlambda)![inputThreshold]
                  ).map((row, idx) => (
                    <tr key={idx} className='odd:bg-white even:bg-gray-50'>
                      <td className='px-3 py-2 border'>
                        {row.image1PoseAnswer}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.image1PoseResult}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.image2PoseAnswer}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.image2PoseResult}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.cosine_original.toFixed(4)}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.euclid_original.toFixed(4)}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.cosine_flipped.toFixed(4)}
                      </td>
                      <td className='px-3 py-2 border'>
                        {row.euclid_flipped.toFixed(4)}
                      </td>
                      <td className='px-3 py-2 border'>{row.isSameAnswer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
}
