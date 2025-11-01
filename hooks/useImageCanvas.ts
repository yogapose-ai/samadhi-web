import { useRef, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { calculateAllAngles, vectorize } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import type { JointAngles, Landmark } from "@/types/pose.types";

const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
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
    imageLabel?: number; // 이미지 번호
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function useImageCanvas({
  imageLabel = 1, // 이미지 번호
  isInitialized,
  landmarker,
}: UseImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  //   const { image1: image, setImage1Data: setImageData, setPreviousAngles } = usePoseStore();
  const { image1, image2, setImage1Data, setImage2Data, setPreviousAngles } = usePoseStore();  
  // imageLabel에 따라 해당하는 이미지 데이터와 리셋 함수를 선택
  const image = imageLabel === 1 ? image1 : image2;
  const setImageData = imageLabel === 1 ? setImage1Data : setImage2Data;

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
        
        const data = vectorize(landmarks, imageElement.naturalHeight, imageElement.naturalWidth);
        // console.log(data)

        drawSkeleton(ctx, landmarks);

        if (worldLandmarks) {
          const angles = calculateAllAngles(
            worldLandmarks,
            image.previousAngles,
            (angles: JointAngles) => setPreviousAngles(`image${imageLabel==1?1:2}`, angles)
          );
          setImageData(landmarks as Landmark[], angles, fps, data);
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
          0,
          [],
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInitialized, landmarker, setImageData],
  );

  return { canvasRef, imageRef, processImage };
}
