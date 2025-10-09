import MultiImageDetector from "@/components/image-detector/MultiImageDetector";

export default function MultiPosePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="container mx-auto max-w-5xl my-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Multi Image Pose Detection
          </h1>
          <p className="text-gray-600">
            여러 이미지의 관절 각도를 계산하고 평균값을 파일로 저장합니다.
          </p>
        </div>

        <MultiImageDetector />
      </div>
    </main>
  );
}
