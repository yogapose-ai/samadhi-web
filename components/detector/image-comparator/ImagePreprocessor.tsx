'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMediaPipe } from '@/hooks/useMediaPipe';

import { Button } from '@/components/ui/button';

export default function ImageComparator() {
  const { imageLandmarker, isInitialized } = useMediaPipe();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageList, setImageList] = useState<string[]>([]);
  const [errorImages, setErrorImages] = useState<string[]>([]);

  const [processedCount, setProcessedCount] = useState<number>(0);

  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/images/list');
        const data = await res.json();
        if (Array.isArray(data.images)) {
          setImageList(data.images);
        } else {
          console.warn('No images field from API response');
        }
      } catch (e) {
        console.error(e);
        alert('이미지 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadAllImages();
  }, []); // 최초 1회 실행

  const detectErrorImages = useCallback(async () => {
    if (!isInitialized || !imageLandmarker) return;
    setIsLoading(true);

    const errorImages: string[] = [];
    // 이미지 랜드마크 검출 가능 여부 확인
    for (let i = 0; i < imageList.length; i++) {
      const imagePath = imageList[i];
      try {
        const img = new Image();
        img.src = imagePath;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = () =>
            reject(new Error(`이미지를 불러올 수 없습니다: ${imagePath}`));
        });

        const detectResults = imageLandmarker.detect(img);
        if (
          !detectResults ||
          !detectResults.landmarks ||
          detectResults.landmarks.length === 0
        ) {
          errorImages.push(imagePath);
        }
      } catch (error) {
        console.log(error);
        errorImages.push(imagePath);
      } finally {
        setProcessedCount(i + 1);
      }
    }
    setErrorImages(errorImages);
    setIsLoading(false);
  }, [isInitialized, imageLandmarker, imageList]);

  const downloadErrorImagesTxt = useCallback(() => {
    if (!errorImages || errorImages.length === 0) return;
    const content = errorImages.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'errorimages.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [errorImages]);

  return (
    <div className='w-full space-y-4'>
      <div className='gap-2 text-sm'>
        <Button
          onClick={detectErrorImages}
          disabled={!isInitialized || imageList.length === 0}
          size='default'
          className='gap-2 h-9 text-sm w-auto px-5'
          variant='outline'
        >
          에러 이미지 탐지하기
        </Button>
      </div>
      {isLoading && (
        <div className='text-sm'>
          진행 중... ({processedCount}/{imageList.length})
        </div>
      )}
      {!isLoading && (
        <div className='space-y-3'>
          <div className='text-sm'>
            전체 이미지:{' '}
            <span className='font-semibold'>{imageList.length}</span>
          </div>
          <div className='text-sm'>
            에러 이미지:{' '}
            <span className='font-semibold'>{errorImages.length}</span>
          </div>
          {errorImages.length > 0 && (
            <div>
              <Button
                size='sm'
                variant='outline'
                onClick={downloadErrorImagesTxt}
                className='h-8 px-3'
              >
                에러 이미지 목록 다운로드 (txt)
              </Button>
            </div>
          )}
          {errorImages.length > 0 && (
            <div className='max-h-96 overflow-auto border rounded'>
              <ul className='text-xs divide-y'>
                {errorImages.map((p) => (
                  <li key={p} className='px-3 py-2'>
                    <a
                      className='text-blue-600 underline'
                      href={p}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
