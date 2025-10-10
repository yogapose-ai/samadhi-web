import DetectorCard from "./components/DetectorCard";
import WebcamDetector from "@/components/detector/webcam-detector/WebcamDetector";
import ImageDetector from "@/components/detector/image-detector/ImageDetector";
import VideoDetector from "@/components/detector/video-detector/VideoDetector";

export default function DetectorTestPage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'>
      <div className='container mx-auto my-10'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-extrabold mb-3 text-gray-800'>
            포즈 감지 테스트
          </h1>
        </div>

        <div className='flex flex-wrap lg:flex-nowrap gap-6 items-stretch'>
          <DetectorCard
            title='웹캠'
            linkHref='/test/webcam'
            linkText='웹캠 테스트'
          >
            <WebcamDetector />
          </DetectorCard>

          <DetectorCard
            title='이미지'
            linkHref='/test/image'
            linkText='이미지 테스트'
          >
            <ImageDetector />
          </DetectorCard>

          <DetectorCard
            title='비디오'
            linkHref='/test/video'
            linkText='비디오 테스트'
          >
            <VideoDetector />
          </DetectorCard>
        </div>
      </div>
    </main>
  );
}
