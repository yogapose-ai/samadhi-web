import { JointAngles } from "@/types/pose.types";
import { CalculateSimilarity } from "../medaipipe/angle-calculator";
import { poseVectorizedData } from "@/types/poseVectorizedData";

export function classifyPoseWithVectorized(vectorized: number[]) {
    let bestPose = "unknown";
    let maxDistance = 0;
    const distPerPose: Record<string, number> = {};
    const THRESHOLD = 80;

    // 좌우 반전 버전 생성
    // const mirroredAngles = normalizeMirroredAngles(angles);
    const mirroredVectorized = vectorized;

    for (const [name, poseVectorized] of Object.entries(poseVectorizedData)) {
      const calcDistance = (a: number[]) => {
        const similarity = CalculateSimilarity(poseVectorized, a, 1);
        
        // 1에 가까울수록 다름, 0에 가까울수록 유사
        return similarity;
      };

      // 원본과 반전 둘 다 계산
      const distanceOriginal = calcDistance(vectorized);
      const distanceMirrored = calcDistance(mirroredVectorized);

      // 더 유사한 쪽 선택
      const maxForThisPose = Math.max(distanceOriginal, distanceMirrored);

      if (maxForThisPose > THRESHOLD && maxForThisPose > maxDistance) {
        maxDistance = maxForThisPose;
        bestPose = name;
      }
      
      distPerPose[name] = maxForThisPose;
    }
    
    // console.log("distPerPose:", distPerPose);
    // console.log("Best Pose:", bestPose)

    return {bestPose, distPerPose};
  };
  
// 좌우 반전된 각도 데이터 생성 함수
// export const normalizeMirroredAngles = (angles: JointAngles): JointAngles => {
//     const swapped: Partial<JointAngles> = { ...angles };

//     // 좌우 대칭 쌍 정의
//     const mirrorPairs = [
//       ["leftShoulder", "rightShoulder"],
//       ["leftElbow", "rightElbow"],
//       ["leftWrist", "rightWrist"],
//       ["leftHip", "rightHip"],
//       ["leftKnee", "rightKnee"],
//       ["leftAnkle", "rightAnkle"],
//       ["leftHipShoulderAlign", "rightHipShoulderAlign"],
//     ];

//     // 각 쌍의 값을 교환
//     mirrorPairs.forEach(([left, right]) => {
//       const temp = swapped[left as keyof JointAngles];
//       swapped[left as keyof JointAngles] = swapped[right as keyof JointAngles];
//       swapped[right as keyof JointAngles] = temp;
//     });

//     // spine, neckAngle은 중앙 기준이므로 그대로 유지
//     return swapped as JointAngles;
// };