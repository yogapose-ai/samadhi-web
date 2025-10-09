import { create } from "zustand";
import type { Landmark, JointAngles } from "@/types/pose";

const createSourceState = () => ({
  landmarks: null as Landmark[] | null,
  angles: null as JointAngles | null,
  fps: 0 as number,
});

interface PoseStore {
  // 웹캠 데이터
  webcam: ReturnType<typeof createSourceState>;

  // 이미지 데이터
  image: ReturnType<typeof createSourceState>;

  setWebcamData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number
  ) => void;

  setImageData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number
  ) => void;

  resetAllData: () => void;
  resetImage: () => void;
  resetWebcam: () => void;
}

const initialState: Omit<
  PoseStore,
  | "setWebcamData"
  | "setImageData"
  | "resetAllData"
  | "resetImage"
  | "resetWebcam"
> = {
  webcam: createSourceState(),
  image: createSourceState(),
};

export const usePoseStore = create<PoseStore>((set) => ({
  ...initialState,

  setWebcamData: (landmarks, angles, fps) =>
    set((state) => ({ webcam: { landmarks, angles, fps } })),

  setImageData: (landmarks, angles, fps) =>
    set((state) => ({ image: { landmarks, angles, fps } })),

  resetImage: () => set({ image: createSourceState() }),
  resetWebcam: () => set({ webcam: createSourceState() }),

  resetAllData: () => set(initialState),
}));
