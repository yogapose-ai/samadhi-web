import { useState, useRef, useCallback } from "react";

export function useWebcam() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      videoElement.srcObject = stream;
      streamRef.current = stream;
      setIsActive(true);
      setError(null);
      // console.log("✅ Webcam started");
    } catch {
      const message = "웹캠 접근 실패. 권한을 확인해주세요.";
      setError(message);
      // console.error("❌ Webcam error:", err);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsActive(false);
      // console.log("⏸️  Webcam stopped");
    }
  }, []);

  return {
    isActive,
    error,
    startWebcam,
    stopWebcam,
  };
}
