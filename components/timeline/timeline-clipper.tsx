"use client";

import { CalculateSimilarity } from "@/lib/medaipipe/angle-calculator";
import { usePoseStore } from "@/store/poseStore";
import { useEffect, useState } from "react";

type Timeline = {
  pose: string;
  startTime: number;
  endTime: number;
  similarity: number;
};

export default function TimelineClipper() {
  const { video, webcam } = usePoseStore();
  const [currentPose, setCurrentPose] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [similarities, setSimilarities] = useState<number[]>([]);

  useEffect(() => {
    if (video.poseClass !== currentPose) {
      const now = Date.now();
      if (currentPose) {
        // End the previous pose timeline
        setTimelines((prev) => {
          const updated = [...prev];
          const lastTimeline = updated[updated.length - 1];
          const avgSimilarity =
            similarities.length > 0
              ? similarities.reduce((a, b) => a + b, 0) / similarities.length
              : 0;
          if (lastTimeline && lastTimeline.endTime === 0) {
            lastTimeline.endTime = now;
            lastTimeline.similarity = avgSimilarity;
            setSimilarities([]); // Reset similarities for the next pose
          }

          return updated;
        });
      }
      // Start a new pose timeline
      if (video.poseClass !== "unknown") {
        setTimelines((prev) => [
          ...prev,
          { pose: video.poseClass, startTime: now, endTime: 0, similarity: 0 },
        ]);
        setCurrentPose(video.poseClass);
      }
    }
  }, [video.poseClass]);

  useEffect(() => {
    if (timelines.length === 0) return;
    const lastTimeline = timelines[timelines.length - 1];
    if (lastTimeline.endTime === 0) {
      const similarity = CalculateSimilarity(
        webcam.vectorized,
        video.vectorized,
      );
      setSimilarities((prev) => [...prev, similarity]);
    }
  }, [timelines, webcam.vectorized, video.vectorized]);

  return (
    <div>
      <ul className="list-disc list-inside max-h-60 overflow-y-auto">
        {timelines.map((timeline, index) => (
          <li key={index}>
            자세: <strong>{timeline.pose}</strong>, 시작 시간:{" "}
            {new Date(timeline.startTime).toLocaleTimeString()}, 종료 시간:{" "}
            {timeline.endTime
              ? new Date(timeline.endTime).toLocaleTimeString()
              : "진행 중"}
            , 유사도: {timeline.similarity.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
