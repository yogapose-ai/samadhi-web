import {
  findBestThreshold,
  ThresholdAccuracy,
} from '@/lib/poseComparator/accuracy-calculator';
import { BestAccuracyDisplay } from './BestAccuracyDisplay';
import { AccuracyChart } from './AccuracyChart';

export default function AccuracyPerLambdaDisplay({
  lambdas,
  accuracyPerLambda,
}: {
  lambdas: number[];
  accuracyPerLambda: Map<number, ThresholdAccuracy[]>;
}) {
  return (
    <div className='space-y-6'>
      {/* 최고 정확도 & confusion matrix 표시 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {lambdas.map((lambda) => {
          if (!accuracyPerLambda.has(lambda)) return null;
          return (
            <BestAccuracyDisplay
              key={lambda}
              lambda={lambda}
              bestThreshold={findBestThreshold(accuracyPerLambda.get(lambda)!)}
            />
          );
        })}
      </div>
      {/* 정확도 그래프 */}
      <AccuracyChart thresholdAccuracies={accuracyPerLambda} />
    </div>
  );
}
