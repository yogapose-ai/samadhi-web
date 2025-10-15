"use client";

import { useImageCanvas } from "@/hooks/useImageCanvas";
import { PoseLandmarker } from "@mediapipe/tasks-vision";

import { Image } from "lucide-react";
import { useEffect } from "react";

interface ImageCanvasProps {
  imageLabel?: number; // 이미지 번호
  imageSrc: string | null;
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function ImageCanvas({
  imageLabel = 1, // 이미지 번호
  imageSrc,
  isInitialized,
  landmarker,
}: ImageCanvasProps) {
  const { canvasRef, imageRef, processImage } = useImageCanvas({
    imageLabel, // 이미지 번호
    isInitialized,
    landmarker,
  });

  useEffect(() => {
    const imageElement = imageRef.current;
    if (imageElement && imageSrc && isInitialized && landmarker) {
      imageElement.onload = () => {
        processImage(imageElement);
      };
      if (imageElement.complete) {
        processImage(imageElement);
      }
    }
  }, [imageRef, imageSrc, isInitialized, landmarker, processImage]);

  return (
    <div className='relative border border-dashed border-gray-300 rounded-lg w-full'>
      <img
        ref={imageRef}
        src={imageSrc || undefined}
        alt='Uploaded Pose'
        className='hidden'
        crossOrigin='anonymous'
      />
      <canvas
        ref={canvasRef}
        className='block max-w-full h-auto rounded-lg'
        style={{ display: imageSrc ? 'block' : 'none' }}
      />

      {!imageSrc && (
        <div className='w-full min-h-64 flex items-center justify-center'>
          <div className='text-center text-gray-400 p-10'>
            <Image className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p>감지할 이미지를 선택하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
