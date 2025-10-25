"use client";

import { useState, useCallback, useRef } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { ImageControls } from "./ui/ImageControls";
import { calculateAllAngles } from "@/lib/medaipipe/angle-calculator";
import type { JointAngles } from "@/types/pose";

// 샘플 이미지 목록 (public/images 폴더)
const SAMPLE_IMAGES = [
  {
    name: "Tree",
    path: "/images/tree_pose.png",
  },
];

export default function ImageMultiDetector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { imageLandmarker, isInitialized, error: mpError } = useMediaPipe();
  const [averageAngles, setAverageAngles] = useState<JointAngles | null>(null);
  const [results, setResults] = useState<JointAngles[]>([]);

  const handleFilesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !isInitialized || !imageLandmarker) return;

      const newResults: JointAngles[] = [];

      for (const file of Array.from(files)) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        const detection = imageLandmarker.detect(img);

        if (detection.landmarks && detection.landmarks.length > 0) {
          const worldLandmarks = detection.worldLandmarks?.[0];
          if (worldLandmarks) {
            const angles = calculateAllAngles(
              worldLandmarks,
              {},
              (_: JointAngles) => {},
            );
            newResults.push(angles);
          }
        }
        URL.revokeObjectURL(img.src);
      }
      setResults(newResults);

      // 평균 계산
      if (newResults.length > 0) {
        const keys = Object.keys(newResults[0]) as (keyof JointAngles)[];
        const avg = keys.reduce((acc, key) => {
          const sum = newResults.reduce((s, a) => s + a[key], 0);
          return { ...acc, [key]: sum / newResults.length };
        }, {} as JointAngles);

        setAverageAngles(avg);
      }
    },
    [isInitialized, imageLandmarker],
  );

  const handleDownload = useCallback(() => {
    if (!averageAngles) return;
    const blob = new Blob([JSON.stringify(averageAngles, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "average_angles.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [averageAngles]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">다중 이미지 포즈 평균 계산</h2>

      <ImageControls
        onFileChange={handleFilesChange}
        onReset={() => {
          setResults([]);
          setAverageAngles(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        isInitialized={isInitialized}
        imageLoaded={results.length > 0}
        fileInputRef={fileInputRef}
        sampleImages={SAMPLE_IMAGES}
        onSampleSelect={(_: string) => {
          alert(
            "샘플 이미지는 다중 이미지 처리에서 작동하지 않습니다.\n이미지 업로드 파일 버튼을 이용해주세요.",
          );
        }}
        currentImageSrc={null}
      />

      {mpError && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-md">
          {mpError}
        </div>
      )}

      {averageAngles && (
        <div className="p-4 bg-gray-100 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">평균 관절 각도</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(averageAngles).map(([key, value]) => (
              <li key={key}>
                {key}: {value.toFixed(2)}°
              </li>
            ))}
          </ul>

          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            평균 각도 파일 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
