import { create } from "zustand";
import type { Landmark, JointAngles } from "@/types/pose";

interface PoseStore {
  // 웹캠 데이터
  webcamLandmarks: Landmark[] | null;
  webcamAngles: JointAngles | null;
  webcamFps: number;

  setWebcamData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number
  ) => void;
}

export const usePoseStore = create<PoseStore>((set) => ({
  webcamLandmarks: null,
  webcamAngles: null,
  webcamFps: 0,

  setWebcamData: (landmarks, angles, fps) =>
    set({ webcamLandmarks: landmarks, webcamAngles: angles, webcamFps: fps }),
}));
