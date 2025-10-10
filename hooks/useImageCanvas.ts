import { useRef, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { calculateAllAngles } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import type { JointAngles, Landmark } from "@/types/pose";

const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[]
) => {
  const drawingUtils = new DrawingUtils(ctx);

  // 연결선
  drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 3,
  });

  // 랜드마크 포인트
  drawingUtils.drawLandmarks(landmarks, {
    color: "#FFFFFF",
    radius: 3,
    fillColor: "#FFFFFF",
  });
};

interface UseImageCanvasProps {
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function useImageCanvas({
  isInitialized,
  landmarker,
}: UseImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { image, setImageData, setPreviousAngles } = usePoseStore();

  // 단일 이미지 감지 및 렌더링
  const processImage = useCallback(
    async (imageElement: HTMLImageElement) => {
      if (!isInitialized || !landmarker || !canvasRef.current || !imageElement)
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      const startTime = performance.now();
      const results = landmarker.detect(imageElement);
      const endTime = performance.now();

      const fps = Math.round(1000 / (endTime - startTime));

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const worldLandmarks = results.worldLandmarks?.[0];

        drawSkeleton(ctx, landmarks);

        if (worldLandmarks) {
          const angles = calculateAllAngles(
            worldLandmarks,
            image.previousAngles,
            (angles: JointAngles) => setPreviousAngles("image", angles)
          );
          setImageData(landmarks as Landmark[], angles, fps);
        }
      } else {
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 24px Arial";
        ctx.fillText("포즈를 감지할 수 없습니다.", 20, 40);
        setImageData(
          [],
          {
            leftElbow: 0,
            rightElbow: 0,
            leftShoulder: 0,
            rightShoulder: 0,
            leftWrist: 0,
            rightWrist: 0,
            spine: 0,
            leftHipShoulderAlign: 0,
            rightHipShoulderAlign: 0,
            leftHip: 0,
            rightHip: 0,
            leftKnee: 0,
            rightKnee: 0,
            leftAnkle: 0,
            rightAnkle: 0,
            neckAngle: 0,
          },
          0
        );
      }
    },
    [isInitialized, landmarker, setImageData]
  );

  return { canvasRef, imageRef, processImage };
}
