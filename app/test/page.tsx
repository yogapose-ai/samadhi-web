import PoseDetector from "@/components/pose/PoseDetector";

export default function TestPage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'>
      <div className='container mx-auto max-w-5xl my-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>
            Samadhi Pose Detection Test
          </h1>
          <p className='text-gray-600'>
            MediaPipe 포즈 감지 및 관절 각도 계산 테스트
          </p>
        </div>

        <PoseDetector />
      </div>
    </main>
  );
}
