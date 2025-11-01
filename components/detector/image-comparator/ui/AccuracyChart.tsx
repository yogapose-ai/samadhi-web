import { ThresholdAccuracy } from '@/lib/poseComparator/accuracy-calculator';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);
// 정확도 그래프 컴포넌트
export const AccuracyChart = ({
  thresholdAccuracies,
}: {
  thresholdAccuracies: Map<number, ThresholdAccuracy[]>;
}) => {
  const options = {
    responsive: true,
    title: {
      display: true,
      text: 'Threshold별 정확도',
    },
    tooltips: {
      enabled: true,
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const labels = Array.from({ length: 101 }, (_, i) => i.toString());
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Threshold별 정확도 그래프</h3>
      <div className='flex justify-center bg-white p-4 rounded-lg'>
        <Line
          options={options}
          data={{
            labels: labels,
            datasets: Array.from(thresholdAccuracies.entries()).map(
              ([lambda, accuracies], index) => ({
                label: lambda.toString(),
                data: accuracies.map((ta) => ta.accuracy),
                borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                fill: false,
                tension: 0.1,
              })
            ),
          }}
        />
      </div>
    </div>
  );
};
