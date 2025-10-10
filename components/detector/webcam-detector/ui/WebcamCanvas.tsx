"use client";

import { CameraOff } from "lucide-react";
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { useWebcamCanvas } from "@/hooks/useWebcamCanvas";

interface WebcamCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function WebcamCanvas({
  videoRef,
  isActive,
  isInitialized,
  landmarker,
}: WebcamCanvasProps) {
  const { canvasRef } = useWebcamCanvas({
    videoRef,
    isActive,
    isInitialized,
    landmarker,
  });

  return (
    <div className='bg-black rounded-lg overflow-hidden aspect-video relative'>
      <video
        ref={videoRef}
        className='absolute inset-0 w-full h-full object-contain opacity-50'
        playsInline
        muted
      />
      <canvas ref={canvasRef} className='w-full h-full object-contain' />
      {!isActive && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center text-gray-400'>
            <CameraOff className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p>카메라를 시작하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
