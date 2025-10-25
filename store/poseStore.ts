import { create } from "zustand";
import type { Landmark, JointAngles } from "@/types/pose";

const createSourceState = () => ({
  landmarks: null as Landmark[] | null,
  angles: null as JointAngles | null,
  fps: 0 as number,
  previousAngles: {} as Partial<JointAngles>,
  vectorized: [] as number[],
});

interface PoseStore {
  // 웹캠 데이터
  webcam: ReturnType<typeof createSourceState>;

  // 이미지 데이터
  image: ReturnType<typeof createSourceState>;

  // 영상 데이터
  video: ReturnType<typeof createSourceState>;

  setPreviousAngles: (
    source: "webcam" | "video" | "image",
    angles: Partial<JointAngles>,
  ) => void;

  setWebcamData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
  ) => void;

  setImageData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
  ) => void;

  setVideoData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
  ) => void;

  resetAllData: () => void;
  resetWebcam: () => void;
  resetImage: () => void;
  resetVideo: () => void;
}

const initialState: Omit<
  PoseStore,
  | "setPreviousAngles"
  | "setWebcamData"
  | "setImageData"
  | "setVideoData"
  | "resetAllData"
  | "resetImage"
  | "resetWebcam"
  | "resetVideo"
> = {
  webcam: createSourceState(),
  image: createSourceState(),
  video: createSourceState(),
};

export const usePoseStore = create<PoseStore>((set) => ({
  ...initialState,

  setPreviousAngles: (source, angles) =>
    set((state) => ({
      [source]: { ...state[source], previousAngles: angles },
    })),

  setWebcamData: (landmarks, angles, fps, vectorized) =>
    set((_) => ({
      webcam: { landmarks, angles, fps, previousAngles: {}, vectorized },
    })),

  setImageData: (landmarks, angles, fps, vectorized) =>
    set((_) => ({
      image: { landmarks, angles, fps, previousAngles: {}, vectorized },
    })),

  setVideoData: (landmarks, angles, fps, vectorized) =>
    set((_) => ({
      video: { landmarks, angles, fps, previousAngles: {}, vectorized },
    })),

  resetImage: () => set({ image: createSourceState() }),
  resetWebcam: () => set({ webcam: createSourceState() }),
  resetVideo: () => set({ video: createSourceState() }),

  resetAllData: () => set(initialState),
}));
