"use client";

import { useEffect, useRef } from "react";
import {
  DrawingUtils,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { Video } from "lucide-react";
import {
  calculateAllAngles,
  vectorize,
} from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import { JointAngles } from "@/types/pose.types";

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  selectedVideo: string;
  isInitialized: boolean;
  landmarker: PoseLandmarker | null;
}

export function VideoCanvas({
  videoRef,
  isPlaying,
  selectedVideo,
  isInitialized,
  landmarker,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const { video, setVideoData, setPreviousAngles } = usePoseStore();

  useEffect(() => {
    if (isPlaying && isInitialized && videoRef.current && landmarker) {
      detectLoop();
    } else if (!isPlaying && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, animationRef, isPlaying, isInitialized, landmarker]);

  // 포즈 감지 루프
  const detectLoop = () => {
    if (!videoRef.current || !canvasRef.current || !landmarker || !isPlaying) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const videoElement = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && ctx) {
      if (videoElement.videoWidth <= 0 && videoElement.videoHeight <= 0) {
        return;
      }
      // 캔버스 크기 조정
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // 비디오 프레임 그리기
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // 포즈 감지 (비디오용)
      const now = performance.now();
      const results = landmarker.detectForVideo(videoElement, now);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const worldLandmarks = results.worldLandmarks?.[0];

        const data = vectorize(
          landmarks,
          videoElement.videoHeight,
          videoElement.videoWidth,
        );

        if (worldLandmarks) {
          // 각도 계산
          const angles = calculateAllAngles(
            worldLandmarks,
            video.previousAngles,
            (angles: JointAngles) => setPreviousAngles("video", angles),
          );

          // FPS 계산
          const fps = lastFrameTime.current
            ? Math.round(1000 / (now - lastFrameTime.current))
            : 0;
          lastFrameTime.current = now;

          // Store에 저장
          setVideoData(landmarks, angles, fps, data);

          // 스켈레톤 그리기
          drawSkeleton(ctx, landmarks);
        } else {
          drawSkeleton(ctx, landmarks);
          ctx.fillStyle = "#FF9900";
          ctx.font = "bold 24px Arial";
          ctx.fillText("처리 중...", 20, 35);
        }
      } else {
        ctx.fillStyle = "#FFFF00";
        ctx.font = "bold 24px Arial";
        ctx.fillText("사람을 찾는 중...", 20, 35);
      }
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(detectLoop);
    }
  };

  // 스켈레톤 그리기
  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
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

  return (
    <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
      {/* 원본 비디오 (숨김) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain opacity-0"
        playsInline
      />

      {/* 결과 캔버스 */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ display: selectedVideo ? "block" : "none" }}
      />

      {!selectedVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>감지할 비디오를 선택하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
