"use client";

import { useMediaPipe } from "@/hooks/useMediaPipe";
import { useWebcam } from "@/hooks/useWebcam";
import { usePoseStore } from "@/store/poseStore";
import { WebcamControls } from "./ui/WebcamControls";
import { AngleDisplayCard } from "../AngleDisplayCard";
import { useRef } from "react";
import { WebcamCanvas } from "./ui/WebcamCanvas";
import { CalculateSimilarity } from "@/lib/medaipipe/angle-calculator";

export default function WebcamDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { liveLandmarker, isInitialized } = useMediaPipe();
  const { isActive, startWebcam, stopWebcam } = useWebcam();
  const { webcam } = usePoseStore();

  const P1 = [0.5, 0.5, 0.5, 0.7, 0.9];
  const P2 = [0.12, 0.28, 0.55, 0.68, 0.95];

  // 웹캠 시작 핸들러
  const handleStart = async () => {
    if (!videoRef.current || !isInitialized) return;
    await startWebcam(videoRef.current);
    videoRef.current?.play();
  };

  // 웹캠 중지 핸들러
  const handleStop = () => {
    stopWebcam();
  };

  return (
    <div className="w-full space-y-4">
      <WebcamCanvas
        videoRef={videoRef}
        isActive={isActive}
        isInitialized={isInitialized}
        landmarker={liveLandmarker}
      />

      <AngleDisplayCard
        angles={webcam.angles}
        similarity={CalculateSimilarity(P1, P2)}
      />

      <WebcamControls
        isActive={isActive}
        isInitialized={isInitialized}
        webcamFps={webcam.fps}
        onStart={handleStart}
        onStop={handleStop}
      />
    </div>
  );
}
