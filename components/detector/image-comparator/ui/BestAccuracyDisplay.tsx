import { ThresholdAccuracy } from '@/lib/poseComparator/accuracy-calculator';
import { ConfusionMatrix } from './ConfusionMatrix';

// 최고 정확도 표시 컴포넌트
export const BestAccuracyDisplay = ({
  lambda,
  bestThreshold,
}: {
  lambda: number;
  bestThreshold: ThresholdAccuracy;
}) => {
  const total =
    bestThreshold.confusionMatrix.tp +
    bestThreshold.confusionMatrix.tn +
    bestThreshold.confusionMatrix.fp +
    bestThreshold.confusionMatrix.fn;
  const correct =
    bestThreshold.confusionMatrix.tp + bestThreshold.confusionMatrix.tn;
  return (
    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
      <h3 className='text-lg font-semibold text-green-800 mb-2'>
        lambda={lambda} 에서 최고 성능
      </h3>
      <div className='flex justify-center gap-4 space-y-4 text-sm'>
        <div>
          <span className='font-semibold'>최고 정확도:</span>
          <span className='ml-2 text-green-600 font-bold'>
            {(bestThreshold.accuracy * 100).toFixed(2)}% ({correct}/{total})
          </span>
        </div>
        <div>
          <span className='font-semibold'>최적 Threshold:</span>
          <span className='ml-2 text-green-600 font-bold'>
            {bestThreshold.threshold}
          </span>
        </div>
      </div>
      <div className='flex justify-center gap-4 space-y-4 text-sm'>
        <div>
          <span className='font-semibold'>Precision:</span>
          <span className='ml-2 text-green-600'>
            {(bestThreshold.precision * 100).toFixed(2)}%
          </span>
        </div>
        <div>
          <span className='font-semibold'>Recall:</span>
          <span className='ml-2 text-green-600'>
            {(bestThreshold.recall * 100).toFixed(2)}%
          </span>
        </div>
        <div>
          <span className='font-semibold'>F1-Score:</span>
          <span className='ml-2 text-green-600'>
            {(bestThreshold.f1Score * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 최고 정확도 Confusion Matrix */}
      {/* <div className='space-y-8'>
        <h3 className='text-l font-normal'>최고 정확도 Confusion Matrix</h3>
      </div> */}
      <ConfusionMatrix
        key={bestThreshold.threshold}
        tp={bestThreshold.confusionMatrix.tp}
        tn={bestThreshold.confusionMatrix.tn}
        fp={bestThreshold.confusionMatrix.fp}
        fn={bestThreshold.confusionMatrix.fn}
      />
    </div>
  );
};
