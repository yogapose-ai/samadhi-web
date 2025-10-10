"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { usePoseStore } from "@/store/poseStore";
import { ImageControls } from "./ui/ImageControls";
import { ImageCanvas } from "./ui/ImageCanvas";
import { AngleDisplayCard } from "../AngleDisplayCard";
import { ImageClassifier } from "@/components/classifier/ImageClassifier";


// 샘플 이미지 목록 (public/images 폴더)
const SAMPLE_IMAGES = [
  {
    name: "Tree",
    path: "/images/tree_pose.png",
  },
];

export default function ImageDetector() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { imageLandmarker, isInitialized } = useMediaPipe();
  const { image, resetImage } = usePoseStore();

  const isRevocableUrl = (src: string) => src && src.startsWith("blob:");

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
        fileInputRef.current.value = "";
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
      fileInputRef.current.value = "";
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
        imageSrc={imageSrc}
        isInitialized={isInitialized}
        landmarker={imageLandmarker}
      />

      <AngleDisplayCard angles={image.angles} />

      <ImageControls
        onFileChange={handleFileChange}
        onReset={handleReset}
        isInitialized={isInitialized}
        imageLoaded={!!imageSrc}
        fileInputRef={fileInputRef}
        sampleImages={SAMPLE_IMAGES}
        onSampleSelect={handleSampleSelect}
        currentImageSrc={imageSrc}
      />

      <ImageCanvas
        imageSrc={imageSrc}
        isInitialized={isInitialized}
        landmarker={imageLandmarker}
      />

      <AngleDisplayCard angles={image.angles} />
      <ImageClassifier angles={image.angles} />
    </div>
  );
}
