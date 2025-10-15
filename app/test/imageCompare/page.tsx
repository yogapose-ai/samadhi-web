import ImageComparator from '@/components/detector/image-detector/ImageComparator';

export default function ImagePoseComparePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-6'>
      <div className='container mx-auto my-10'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-extrabold mb-3 text-gray-800'>
            데이터셋 이미지쌍 비교
          </h1>

          <ImageComparator />
        </div>
      </div>
    </main>
  );
}
