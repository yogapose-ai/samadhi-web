"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { usePoseStore } from "@/store/poseStore";
import { ImageControls } from "./ui/ImageControls";
import { ImageCanvas } from "./ui/ImageCanvas";
import { AngleDisplayCard } from "../AngleDisplayCard";
import { ImageClassifier } from "@/components/classifier/ImageClassifier";
import { CalculateSimilarity } from '@/lib/medaipipe/angle-calculator';

// 샘플 이미지 목록 (public/images 폴더)
const SAMPLE_IMAGES = [
  {
    name: 'Tree',
    path: '/images/tree_pose.png',
  },
];

interface ImageDetectorProps {
  imageLabel?: number; // 이미지 번호
}

export default function ImageDetector({ imageLabel = 1 }: ImageDetectorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 각 인스턴스마다 고유한 ID 생성
  const fileInputId = `image-upload-${imageLabel}`;

  const { imageLandmarker, isInitialized } = useMediaPipe();
  const { image1, image2, resetImage1, resetImage2 } = usePoseStore();

  // imageLabel에 따라 해당하는 이미지 데이터와 리셋 함수를 선택
  const image = imageLabel === 1 ? image1 : image2;
  const resetImage = imageLabel === 1 ? resetImage1 : resetImage2;

  const P1 = image1.vectorized;
  const P2 = image2.vectorized;

  const isRevocableUrl = (src: string) => src && src.startsWith('blob:');

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (imageSrc && isRevocableUrl(imageSrc)) {
          URL.revokeObjectURL(imageSrc);
        }
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        resetImage();
      }
    },
    [imageSrc, resetImage]
  );

  const handleSampleSelect = useCallback(
    (path: string) => {
      if (imageSrc && isRevocableUrl(imageSrc)) {
        URL.revokeObjectURL(imageSrc);
      }
      setImageSrc(path);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [imageSrc]
  );

  const handleReset = useCallback(() => {
    if (imageSrc && isRevocableUrl(imageSrc)) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    resetImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageSrc, resetImage]);

  useEffect(() => {
    return () => {
      if (imageSrc && isRevocableUrl(imageSrc)) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  return (
    <div className='w-full space-y-4'>
      <ImageCanvas
        imageLabel={imageLabel}
        imageSrc={imageSrc}
        isInitialized={isInitialized}
        landmarker={imageLandmarker}
      />

      <AngleDisplayCard
        angles={image.angles}
        similarity={CalculateSimilarity(P1, P2)}
      />

      <ImageControls
        onFileChange={handleFileChange}
        onReset={handleReset}
        isInitialized={isInitialized}
        imageLoaded={!!imageSrc}
        fileInputRef={fileInputRef}
        fileInputId={fileInputId}
        sampleImages={SAMPLE_IMAGES}
        onSampleSelect={handleSampleSelect}
        currentImageSrc={imageSrc}
      />

      <ImageClassifier angles={image.angles} />
    </div>
  );
}
