"use client";

import { useState, useCallback, useRef } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { ImageControls } from "./ui/ImageControls";
import { vectorize } from "@/lib/medaipipe/angle-calculator";

// public/images 폴더의 모든 이미지 목록
const ALL_IMAGES = [
  "/images/child.png",
  "/images/cow.png",
  "/images/crow.png",
  "/images/downdog.png",
  "/images/half_boat.jpeg",
  "/images/half_lord_of_the_fishes.png",
  "/images/half_moon_pose.png",
  "/images/handstand.png",
  "/images/high_lunge.jpeg",
  "/images/plank.jpg",
  "/images/plank2.jpg",
  "/images/tree_pose.png",
  "/images/wild_thing.png",
];

// 파일명에서 pose name 추출 함수
function getPoseName(imagePath: string): string {
  const filename = imagePath.split("/").pop() || "";
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "");
  // 언더스코어를 제거하고 소문자로 변환
  return nameWithoutExt.replace(/_/g, "");
}

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
  const [vectorizedResults, setVectorizedResults] = useState<
    Record<string, number[]>
  >({});
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processAllImages = useCallback(async () => {
    if (!isInitialized || !imageLandmarker) return;

    setIsProcessing(true);
    const newVectorizedResults: Record<string, number[]> = {};
    let successCount = 0;

    for (const imagePath of ALL_IMAGES) {
      try {
        const img = new Image();
        img.src = imagePath;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${imagePath}`));
        });

        const detection = imageLandmarker.detect(img);

        if (detection.landmarks && detection.landmarks.length > 0) {
          const landmarks = detection.landmarks[0];
          if (landmarks) {
            const vectorized = vectorize(
              landmarks,
              img.naturalHeight,
              img.naturalWidth,
            );
            const poseName = getPoseName(imagePath);
            newVectorizedResults[poseName] = vectorized;
            successCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing ${imagePath}:`, error);
      }
    }

    setVectorizedResults(newVectorizedResults);
    setProcessedCount(successCount);
    setIsProcessing(false);

    // 자동으로 파일 저장
    if (Object.keys(newVectorizedResults).length > 0) {
      // TypeScript 파일 형식으로 저장 (poseVectorizedData.ts 형식)
      const tsContent = `export const poseVectorizedData = ${JSON.stringify(
        newVectorizedResults,
        null,
        4,
      )};`;

      const blob = new Blob([tsContent], {
        type: "text/typescript",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poseVectorizedData.ts`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [isInitialized, imageLandmarker]);

  const handleFilesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !isInitialized || !imageLandmarker) return;

      setIsProcessing(true);
      const newVectorizedResults: Record<string, number[]> = {};
      let successCount = 0;

      for (const file of Array.from(files)) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });

        const detection = imageLandmarker.detect(img);

        if (detection.landmarks && detection.landmarks.length > 0) {
          const landmarks = detection.landmarks[0];
          if (landmarks) {
            const vectorized = vectorize(
              landmarks,
              img.naturalHeight,
              img.naturalWidth,
            );
            // 파일명에서 pose name 추출
            const poseName = getPoseName(file.name);
            newVectorizedResults[poseName] = vectorized;
            successCount++;
          }
        }
        URL.revokeObjectURL(img.src);
      }

      setVectorizedResults(newVectorizedResults);
      setProcessedCount(successCount);
      setIsProcessing(false);

      // 자동으로 파일 저장
      if (Object.keys(newVectorizedResults).length > 0) {
        // poseVectorizedData.ts 형식으로 저장
        const tsContent = `export const poseVectorizedData = ${JSON.stringify(
          newVectorizedResults,
          null,
          4,
        )};`;

        const blob = new Blob([tsContent], {
          type: "text/typescript",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `poseVectorizedData.ts`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [isInitialized, imageLandmarker],
  );

  const handleDownload = useCallback(() => {
    if (Object.keys(vectorizedResults).length === 0) return;

    // poseVectorizedData.ts 형식으로 저장
    const tsContent = `export const poseVectorizedData = ${JSON.stringify(
      vectorizedResults,
      null,
      4,
    )};`;

    const blob = new Blob([tsContent], {
      type: "text/typescript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poseVectorizedData.ts`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vectorizedResults]);

  const firstVectorized = Object.values(vectorizedResults)[0];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        다중 이미지 Vectorized 데이터 생성
      </h2>

      <div className="flex gap-4 items-center">
        <ImageControls
          onFileChange={handleFilesChange}
          onReset={() => {
            setVectorizedResults({});
            setProcessedCount(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          isInitialized={isInitialized}
          imageLoaded={Object.keys(vectorizedResults).length > 0}
          fileInputRef={fileInputRef}
          fileInputId={"image-upload"}
          sampleImages={SAMPLE_IMAGES}
          onSampleSelect={(path: string) => {
            alert(
              "샘플 이미지는 다중 이미지 처리에서 작동하지 않습니다.\n이미지 업로드 파일 버튼을 이용해주세요.",
            );
          }}
          currentImageSrc={null}
        />

        <button
          onClick={processAllImages}
          disabled={!isInitialized || isProcessing}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? "처리 중..." : "public/images 폴더 모든 이미지 처리"}
        </button>
      </div>

      {mpError && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-md">
          {mpError}
        </div>
      )}

      {Object.keys(vectorizedResults).length > 0 && (
        <div className="p-4 bg-gray-100 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">Vectorized 데이터 생성 완료</h3>
          <p className="text-sm text-gray-600">
            처리된 이미지 수: {processedCount}개
          </p>
          {firstVectorized && (
            <p className="text-sm text-gray-600">
              Vectorized 데이터 차원: {firstVectorized.length}차원
            </p>
          )}
          <div className="mt-2">
            <p className="text-sm font-semibold mb-1">처리된 포즈 목록:</p>
            <ul className="text-sm text-gray-600 grid grid-cols-2 gap-1">
              {Object.keys(vectorizedResults).map((poseName) => (
                <li key={poseName}>• {poseName}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            poseVectorizedData.ts 파일 다운로드
          </button>
        </div>
      )}
    </div>
  );
}