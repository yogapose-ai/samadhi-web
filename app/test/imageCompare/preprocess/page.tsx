import ImagePreprocessor from '@/components/detector/image-comparator/ImagePreprocessor';

export default function ImagePreprocessPage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-6'>
      <div className='container mx-auto my-10'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-extrabold mb-3 text-gray-800'>
            데이터셋에서 mediapipe landmark 추출 불가 이미지 제거
          </h1>

          <ImagePreprocessor />
        </div>
      </div>
    </main>
  );
}
