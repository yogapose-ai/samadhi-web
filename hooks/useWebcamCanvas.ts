import { useRef, useEffect, useCallback } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { calculateAllAngles } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import { JointAngles } from "@/types/pose";

interface UseWebcamCanvasProps {
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

  drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 3,
  });

  drawingUtils.drawLandmarks(landmarks, {
    color: "#FFFFFF",
    radius: 3,
    fillColor: "#FFFFFF",
  });
};

export function useWebcamCanvas({
  videoRef,
  isActive,
  isInitialized,
  landmarker,
}: UseWebcamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const { webcam, setWebcamData, setPreviousAngles } = usePoseStore();

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
          const angles = calculateAllAngles(
            worldLandmarks,
            webcam.previousAngles,
            (angles: JointAngles) => setPreviousAngles("webcam", angles)
          );

          // FPS 계산
          const fps = lastFrameTime.current
            ? Math.round(1000 / (now - lastFrameTime.current))
            : 0;
          lastFrameTime.current = now;

          // Store에 저장
          setWebcamData(landmarks, angles, fps);

          // 스켈레톤 그리기
          drawSkeleton(ctx, landmarks);

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
