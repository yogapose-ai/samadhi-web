import { useState, useEffect, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export function useMediaPipe() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker_full.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        landmarkerRef.current = landmarker;
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
      landmarkerRef.current?.close();
    };
  }, []);

  return {
    landmarker: landmarkerRef.current,
    isInitialized,
    error,
  };
}
