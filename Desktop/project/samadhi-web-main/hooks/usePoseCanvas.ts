import { useRef, useEffect, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { calculateAllAngles } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import { JointAngles } from "@/types/pose";

interface UsePoseCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

// 스켈레톤 그리기
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

export function usePoseCanvas({
  videoRef,
  isActive,
  isInitialized,
  landmarker,
}: UsePoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const { setWebcamData } = usePoseStore();

  // 포즈 감지 루프
  const detectLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !landmarker || !isActive) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // 캔버스 크기 조정
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 비디오 프레임 그리기
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // 포즈 감지
      const now = performance.now();
      const results = landmarker.detectForVideo(video, now);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const worldLandmarks = results.worldLandmarks?.[0];

        // 2D 랜드마크가 감지되었다면, 각도 계산 여부와 관계없이 스켈레톤을 즉시 그림
        drawSkeleton(ctx, landmarks);

        if (worldLandmarks) {
          // 각도 계산
          const angles = calculateAllAngles(worldLandmarks);

          // FPS 계산
          const fps = lastFrameTime.current
            ? Math.round(1000 / (now - lastFrameTime.current))
            : 0;
          lastFrameTime.current = now;

          // Store에 저장
          setWebcamData(landmarks, angles, fps);

          // 스켈레톤 그리기
          drawSkeleton(ctx, landmarks);

          // 각도 표시
          drawAngles(ctx, angles);

          // 캔버스 중앙 상단에 감지 성공 메시지 표시
          ctx.fillStyle = "#00FF00";
          ctx.font = "bold 20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("감지 완료!", canvas.width / 2, 40);
          ctx.textAlign = "left";
        } else {
          // 포즈 감지 안 되면 알림
          ctx.fillStyle = "#FF0000";
          ctx.font = "bold 20px Arial";
          ctx.fillText(
            "포즈가 감지되지 않았습니다. 전신을 보여주세요!",
            20,
            40
          );
        }
      } else {
        // 랜드마크 없으면 알림
        ctx.fillStyle = "#FFFF00";
        ctx.font = "bold 20px Arial";
        ctx.fillText("사람을 찾는 중...", 20, 40);
      }
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(detectLoop);
    }
  }, [isActive, landmarker, setWebcamData, videoRef]);

  useEffect(() => {
    if (isActive && isInitialized && videoRef.current) {
      detectLoop();
    } else if (!isActive && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isInitialized]);

  return { canvasRef };
}
