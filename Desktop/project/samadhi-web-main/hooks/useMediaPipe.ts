import { useState, useEffect, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export function useMediaPipe() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const imageLandmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const options = {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker_full.task",
            delegate: "GPU" as "GPU" | "CPU",
          },
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        };

        const liveLandmarker = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          runningMode: "VIDEO",
        });

        const imageLandmarker = await PoseLandmarker.createFromOptions(vision, {
          ...options,
          runningMode: "IMAGE",
        });

        liveLandmarkerRef.current = liveLandmarker;
        imageLandmarkerRef.current = imageLandmarker;
        setIsInitialized(true);
        console.log("✅ MediaPipe initialized");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize";
        setError(message);
        console.error("❌ MediaPipe error:", err);
      }
    }

    initMediaPipe();

    return () => {
      liveLandmarkerRef.current?.close();
      imageLandmarkerRef.current?.close();
    };
  }, []);

  return {
    liveLandmarker: liveLandmarkerRef.current,
    imageLandmarker: imageLandmarkerRef.current,
    isInitialized,
    error,
  };
}
