import ImageDetector from "@/components/detector/image-detector/ImageDetector";
import DetectorCard from '../components/DetectorCard';

export default function ImagePoseTestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="container mx-auto max-w-5xl my-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">이미지 포즈 감지 테스트</h1>
        </div>
        <div className='flex flex-wrap lg:flex-nowrap gap-6 items-stretch'>
          <DetectorCard
            title='이미지 1'
            linkHref='/test/image'
            linkText='동작x'
          >
            <ImageDetector imageLabel={1} />
          </DetectorCard>

          <DetectorCard
            title='이미지 2'
            linkHref='/test/image'
            linkText='동작x'
          >
            <ImageDetector imageLabel={2} />
          </DetectorCard>
        </div>
      </div>
    </main>
  );
}
