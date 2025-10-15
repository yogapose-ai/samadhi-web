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
  ImageComparatorOutput,
  ImagePair,
} from '@/lib/poseComparator/pose-comparator';

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
const LAMBDA = 70;

export default function ImageComparator() {
  const { imageLandmarker, isInitialized } = useMediaPipe();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [results, setResults] = useState<ImageComparatorOutput[]>([]);
  const [imageList, setImageList] = useState<ImagePair[]>(SAMPLE_IMAGES);
  const [processedCount, setProcessedCount] = useState<number>(0);

  useEffect(() => {
    // public 폴더의 파일은 절대 경로로 바로 fetch 할 수 있습니다.
    fetch('/dataset/dataset.json')
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
    const result = await calculatePoseAndSimilarity({
      lambda: LAMBDA,
      imageList: imageList,
      imageLandmarker,
      onProgress: (processed) => setProcessedCount(processed),
    });
    setResults(result);
    setIsLoading(false);
  }, [isInitialized, imageLandmarker, imageList]);

  return (
    <div className='w-full space-y-4'>
      <h2 className='text-xl font-normal'>
        프로젝트 폴더에서 아래 명령어로 이미지쌍 데이터셋 파일을 생성 후
        이미지를 비교해주세요!
      </h2>
      <pre className='bg-gray-100 p-4 rounded text-sm overflow-x-auto'>
        node lib/poseComparator/dataset-composer.js
      </pre>
      <div className='gap-2 text-sm'>
        lambda: {LAMBDA} (cosine {(LAMBDA / 100).toFixed(2)}, euclid{' '}
        {(1 - LAMBDA / 100).toFixed(2)}){' '}
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

      {!isLoading && (
        <div className='space-y-4'>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => saveAsCSV(results)}
            >
              CSV 저장
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => saveAsJSON(results)}
            >
              JSON 저장
            </Button>
          </div>

          {/* Summary: total rows and confusion matrix */}
          {(() => {
            const rows = toFlatRows(results);
            const total = rows.length;
            let tp = 0,
              tn = 0,
              fp = 0,
              fn = 0;
            for (const r of rows) {
              if (r.isSameAnswer === 1 && r.isSameResult === 1) tp++;
              else if (r.isSameAnswer === 0 && r.isSameResult === 0) tn++;
              else if (r.isSameAnswer === 0 && r.isSameResult === 1) fp++;
              else if (r.isSameAnswer === 1 && r.isSameResult === 0) fn++;
            }
            const acc = total ? (tp + tn) / total : 0;
            return (
              <div className='space-y-2'>
                <div className='text-sm'>
                  총 행 개수: <span className='font-semibold'>{total}</span>{' '}
                  (정확도: {(acc * 100).toFixed(1)}%)
                </div>
                <div className='overflow-x-auto flex justify-center'>
                  <table className='text-xs border border-gray-200 mx-auto'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='px-3 py-2 border'></th>
                        <th className='px-3 py-2 border'>Pred 1</th>
                        <th className='px-3 py-2 border'>Pred 0</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='odd:bg-white even:bg-gray-50'>
                        <td className='px-3 py-2 border font-semibold'>
                          True 1
                        </td>
                        <td className='px-3 py-2 border'>{tp}</td>
                        <td className='px-3 py-2 border'>{fn}</td>
                      </tr>
                      <tr className='odd:bg-white even:bg-gray-50'>
                        <td className='px-3 py-2 border font-semibold'>
                          True 0
                        </td>
                        <td className='px-3 py-2 border'>{fp}</td>
                        <td className='px-3 py-2 border'>{tn}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          <div className='overflow-x-auto'>
            <table className='min-w-full text-xs text-left border border-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-3 py-2 border'>이미지1 포즈정답</th>
                  <th className='px-3 py-2 border'>이미지1 포즈예측</th>
                  <th className='px-3 py-2 border'>이미지2 포즈정답</th>
                  <th className='px-3 py-2 border'>이미지2 포즈예측</th>
                  <th className='px-3 py-2 border'>cosine 유사도</th>
                  <th className='px-3 py-2 border'>euclid 유사도</th>
                  <th className='px-3 py-2 border'>최종 유사도 점수</th>
                  <th className='px-3 py-2 border'>일치 정답</th>
                  <th className='px-3 py-2 border'>일치 예측</th>
                </tr>
              </thead>
              <tbody>
                {toFlatRows(results).map((row, idx) => (
                  <tr key={idx} className='odd:bg-white even:bg-gray-50'>
                    <td className='px-3 py-2 border'>{row.image1PoseAnswer}</td>
                    <td className='px-3 py-2 border'>{row.image1PoseResult}</td>
                    <td className='px-3 py-2 border'>{row.image2PoseAnswer}</td>
                    <td className='px-3 py-2 border'>{row.image2PoseResult}</td>
                    <td className='px-3 py-2 border'>
                      {row.cosine.toFixed(4)}
                    </td>
                    <td className='px-3 py-2 border'>
                      {row.euclid.toFixed(4)}
                    </td>
                    <td className='px-3 py-2 border'>{row.mixed.toFixed(2)}</td>
                    <td className='px-3 py-2 border'>{row.isSameAnswer}</td>
                    <td className='px-3 py-2 border'>{row.isSameResult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
