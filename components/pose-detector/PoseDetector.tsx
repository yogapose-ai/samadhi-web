"use client";

import { useMediaPipe } from "@/hooks/useMediaPipe";
import { useWebcam } from "@/hooks/useWebcam";
import { usePoseStore } from "@/store/poseStore";
import { WebcamControls } from "./ui/WebcamControls";
import { AngleDisplayCard } from "./ui/AngleDisplayCard";
import { resetAngleHistory } from "@/lib/medaipipe/angle-calculator";
import { useRef } from "react";
import { PoseCanvas } from "./ui/PoseCanvas";

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { landmarker, isInitialized, error: mpError } = useMediaPipe();
  const { isActive, error: webcamError, startWebcam, stopWebcam } = useWebcam();
  const { webcamAngles, webcamFps } = usePoseStore();

  // 웹캠 시작 핸들러
  const handleStart = async () => {
    if (!videoRef.current || !isInitialized) return;
    await startWebcam(videoRef.current);
    videoRef.current?.play();
  };

  // 웹캠 중지 핸들러
  const handleStop = () => {
    stopWebcam();
    resetAngleHistory();
  };

  const error = mpError || webcamError;

  return (
    <div className='w-full space-y-4'>
      <WebcamControls
        isActive={isActive}
        isInitialized={isInitialized}
        webcamFps={webcamFps}
        onStart={handleStart}
        onStop={handleStop}
      />

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg'>
          {error}
        </div>
      )}

      <PoseCanvas
        videoRef={videoRef}
        isActive={isActive}
        isInitialized={isInitialized}
        landmarker={landmarker}
      />

      <AngleDisplayCard webcamAngles={webcamAngles} />
    </div>
  );
}
