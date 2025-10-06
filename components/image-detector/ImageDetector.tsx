"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { usePoseStore } from "@/store/poseStore";
import { ImageControls } from "./ui/ImageControls";
import { ImageCanvas } from "./ui/ImageCanvas";
import { AngleDisplayCard } from "@/components/pose-detector/ui/AngleDisplayCard";

export default function ImageDetector() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { imageLandmarker, isInitialized, error: mpError } = useMediaPipe();
  const { image, resetImage } = usePoseStore();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        resetImage();
      }
    },
    [imageSrc, resetImage]
  );

  const handleReset = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    resetImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imageSrc, resetImage]);

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const error = mpError;

  return (
    <div className='w-full space-y-4'>
      <h2 className='text-2xl font-semibold'>단일 이미지 포즈 감지</h2>

      <ImageControls
        onFileChange={handleFileChange}
        onReset={handleReset}
        isInitialized={isInitialized}
        imageLoaded={!!imageSrc}
        fileInputRef={fileInputRef}
      />

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg'>
          {error}
        </div>
      )}

      <ImageCanvas
        imageSrc={imageSrc}
        isInitialized={isInitialized}
        landmarker={imageLandmarker}
      />

      <AngleDisplayCard webcamAngles={image.angles} />
    </div>
  );
}
