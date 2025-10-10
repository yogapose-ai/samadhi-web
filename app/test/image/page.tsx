import ImageDetector from "@/components/detector/image-detector/ImageDetector";

export default function ImagePoseTestPage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'>
      <div className='container mx-auto max-w-5xl my-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>이미지 포즈 감지 테스트</h1>
        </div>
        <ImageDetector />
      </div>
    </main>
  );
}
