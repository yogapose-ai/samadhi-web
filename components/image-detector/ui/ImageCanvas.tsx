"use client";

import { useImagePoseCanvas } from "@/hooks/useImagePoseCanvas";
import { PoseLandmarker } from "@mediapipe/tasks-vision";

import { Image } from "lucide-react";
import { useEffect } from "react";

interface ImageCanvasProps {
  imageSrc: string | null;
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function ImageCanvas({
  imageSrc,
  isInitialized,
  landmarker,
}: ImageCanvasProps) {
  const { canvasRef, imageRef, processImage } = useImagePoseCanvas({
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
  }, [imageSrc, isInitialized, landmarker, processImage]);

  return (
    <div
      className='relative border border-dashed border-gray-300 rounded-lg max-w-full'
      style={{ display: "inline-block" }}
    >
      <img
        ref={imageRef}
        src={imageSrc || undefined}
        alt='Uploaded Pose'
        className='hidden'
        crossOrigin='anonymous'
      />
      <canvas ref={canvasRef} className='block max-w-full h-auto rounded-lg' />

      {!imageSrc && (
        <div className='w-full aspect-video flex items-center justify-center'>
          <div className='text-center text-gray-400 p-10'>
            <Image className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p>감지할 이미지를 업로드하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
