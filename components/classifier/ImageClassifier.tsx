"use client";

import { useEffect, useState } from "react";
import type { JointAngles } from "@/types/pose";
import { classifyPose } from '@/lib/poseClassifier/pose-classifier';

interface ImageClassifierProps {
  angles: JointAngles | null;
}

export function ImageClassifier({ angles }: ImageClassifierProps) {
  const [poseName, setPoseName] = useState<string | null>(null);

  // 좌우 반전된 각도 데이터 생성 함수
  const normalizeMirroredAngles = (angles: JointAngles): JointAngles => {
    const swapped: Partial<JointAngles> = { ...angles };

    // 좌우 대칭 쌍 정의
    const mirrorPairs = [
      ["leftShoulder", "rightShoulder"],
      ["leftElbow", "rightElbow"],
      ["leftWrist", "rightWrist"],
      ["leftHip", "rightHip"],
      ["leftKnee", "rightKnee"],
      ["leftAnkle", "rightAnkle"],
      ["leftHipShoulderAlign", "rightHipShoulderAlign"],
    ];

    // 각 쌍의 값을 교환
    mirrorPairs.forEach(([left, right]) => {
      const temp = swapped[left as keyof JointAngles];
      swapped[left as keyof JointAngles] = swapped[right as keyof JointAngles];
      swapped[right as keyof JointAngles] = temp;
    });

    // spine, neckAngle은 중앙 기준이므로 그대로 유지
    return swapped as JointAngles;
  };

  const classifyPose = (angles: JointAngles) => {
    let bestPose = "";
    let minDistance = Infinity;

    // 좌우 반전 버전 생성
    const mirroredAngles = normalizeMirroredAngles(angles);

    for (const [name, poseAngles] of Object.entries(poseDatabase)) {
      const calcDistance = (a: JointAngles) => {
        const keys = Object.keys(a) as (keyof JointAngles)[];

        // dot product, magnitude of a and poseAngles
        const { dot, magA, magB } = keys.reduce(
          (acc, key) => {
            const valA = a[key];
            const valB = poseAngles[key];
            acc.dot += valA * valB;
            acc.magA += valA * valA;
            acc.magB += valB * valB;
            return acc;
          },
          { dot: 0, magA: 0, magB: 0 },
        );

        const similarity = dot / (Math.sqrt(magA) * Math.sqrt(magB));

        // 1에 가까울수록 다름, 0에 가까울수록 유사
        return 1 - similarity;
      };

      // 원본과 반전 둘 다 계산
      const distanceOriginal = calcDistance(angles);
      const distanceMirrored = calcDistance(mirroredAngles);

      // 더 유사한 쪽 선택
      const minForThisPose = Math.min(distanceOriginal, distanceMirrored);

      if (minForThisPose < minDistance) {
        minDistance = minForThisPose;
        bestPose = name;
      }
    }

    return bestPose;
  };

  useEffect(() => {
    if (angles) {
      const result = classifyPose(angles);
      setPoseName(result.bestPose);
      setDistPerPoseRes(result.distPerPose);
    } else {
      setPoseName(null);
      setDistPerPoseRes(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angles]);

  if (!poseName) return null;

  return (<>
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
      감지된 자세: <strong>{poseName}</strong>
    </div>
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 max-h-60 overflow-y-auto">
        자세 유사도:
        <ul className="list-disc list-inside">
          {distPerPoseRes && Object.entries(distPerPoseRes).map(([name, dist]) => (
            <li key={name}>
              {name}: {(1 - dist).toFixed(2)}
            </li>
          ))}
        </ul>
    </div>
  </>
  );
}
