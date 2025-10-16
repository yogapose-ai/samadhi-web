// Confusion Matrix 컴포넌트
export const ConfusionMatrix = ({
  tp,
  tn,
  fp,
  fn,
}: {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}) => (
  <div className='flex justify-center'>
    <table className='text-xs border border-gray-200'>
      <thead>
        <tr className='bg-gray-50'>
          <th className='px-2 py-1 border'></th>
          <th className='px-2 py-1 border'>Pred 1</th>
          <th className='px-2 py-1 border'>Pred 0</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className='px-2 py-1 border font-semibold bg-white'>True 1</td>
          <td className='px-2 py-1 border bg-white'>{tp}</td>
          <td className='px-2 py-1 border bg-white'>{fn}</td>
        </tr>
        <tr>
          <td className='px-2 py-1 border font-semibold bg-white'>True 0</td>
          <td className='px-2 py-1 border bg-white'>{fp}</td>
          <td className='px-2 py-1 border bg-white'>{tn}</td>
        </tr>
      </tbody>
    </table>
  </div>
);
