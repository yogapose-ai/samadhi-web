"use client";

import { useEffect, useState } from "react";
import type { JointAngles } from "@/types/pose";
import { classifyPose } from '@/lib/poseClassifier/pose-classifier';

interface ImageClassifierProps {
  angles: JointAngles | null;
}

export function ImageClassifier({ angles }: ImageClassifierProps) {
  const [poseName, setPoseName] = useState<string | null>(null);
  const [distPerPoseRes, setDistPerPoseRes] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (angles) {
      const result = classifyPose(angles);
      setPoseName(result.bestPose);
      setDistPerPoseRes(result.distPerPose);
    } else {
      setPoseName(null);
      setDistPerPoseRes(null);
    }
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
