import { useRef, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { calculateAllAngles } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import type { Landmark, JointAngles } from "@/types/pose";

const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[]
) => {
  const drawingUtils = new DrawingUtils(ctx);

  // 연결선
  drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 4,
  });

  // 랜드마크 포인트
  drawingUtils.drawLandmarks(landmarks, {
    color: "#FF0000",
    radius: 5,
    fillColor: "#FF0000",
  });
};

// 각도 표시
const drawAngles = (ctx: CanvasRenderingContext2D, angles: JointAngles) => {
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.font = "bold 16px Arial";

  const col1 = [
    `L Elbow: ${angles.leftElbow.toFixed(1)}°`,
    `R Elbow: ${angles.rightElbow.toFixed(1)}°`,
    `L Shoulder: ${angles.leftShoulder.toFixed(1)}°`,
    `R Shoulder: ${angles.rightShoulder.toFixed(1)}°`,
    `L Wrist: ${angles.leftWrist.toFixed(1)}°`,
    `R Wrist: ${angles.rightWrist.toFixed(1)}°`,
    `Spine: ${angles.spine.toFixed(1)}°`,
    `L Align: ${angles.leftHipShoulderAlign.toFixed(1)}°`,
    `R Align: ${angles.rightHipShoulderAlign.toFixed(1)}°`,
  ];

  const col2 = [
    `L Hip: ${angles.leftHip.toFixed(1)}°`,
    `R Hip: ${angles.rightHip.toFixed(1)}°`,
    `L Knee: ${angles.leftKnee.toFixed(1)}°`,
    `R Knee: ${angles.rightKnee.toFixed(1)}°`,
    `L Ankle: ${angles.leftAnkle.toFixed(1)}°`,
    `R Ankle: ${angles.rightAnkle.toFixed(1)}°`,
    `Neck: ${angles.neckAngle.toFixed(1)}°`,
  ];

  const col1X = 20;
  const col2X = 180;
  const lineHeight = 25;

  col1.forEach((text, i) => {
    const y = 30 + i * lineHeight;
    ctx.strokeText(text, col1X, y);
    ctx.fillText(text, col1X, y);
  });

  col2.forEach((text, i) => {
    const y = 30 + i * lineHeight;
    ctx.strokeText(text, col2X, y);
    ctx.fillText(text, col2X, y);
  });
};

interface UseImagePoseCanvasProps {
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function useImagePoseCanvas({
  isInitialized,
  landmarker,
}: UseImagePoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { setImageData } = usePoseStore();

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
          const angles = calculateAllAngles(worldLandmarks);
          setImageData(landmarks as Landmark[], angles, fps);
          drawAngles(ctx, angles);
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
