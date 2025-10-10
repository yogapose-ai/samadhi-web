"use client";

import { useEffect, useState } from "react";
import type { JointAngles } from "@/types/pose";
import { poseDatabase } from "@/types/poseData"; // JSON 데이터 모아둔 곳

interface ImageClassifierProps {
  angles: JointAngles | null;
}

export function ImageClassifier({ angles }: ImageClassifierProps) {
  const [poseName, setPoseName] = useState<string | null>(null);

  // 유클리디안 거리 기반 분류
  const classifyPose = (angles: JointAngles) => {
    let bestPose = "";
    let minDistance = Infinity;

    for (const [name, poseAngles] of Object.entries(poseDatabase)) {
      const distance = Object.keys(poseAngles).reduce((acc, key) => {
        const diff = angles[key as keyof JointAngles] - poseAngles[key as keyof JointAngles];
        return acc + diff * diff;
      }, 0);

      if (distance < minDistance) {
        minDistance = distance;
        bestPose = name;
      }
    }

    return bestPose;
  };

  useEffect(() => {
    if (angles) {
      const result = classifyPose(angles);
      setPoseName(result);
    } else {
      setPoseName(null);
    }
  }, [angles]);

  if (!poseName) return null;

  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
      감지된 자세: <strong>{poseName}</strong>
    </div>
  );
}
