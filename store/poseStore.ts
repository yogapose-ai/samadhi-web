import { create } from "zustand";
import type { Landmark, JointAngles } from "@/types/pose.types";

const createSourceState = () => ({
  landmarks: null as Landmark[] | null,
  angles: null as JointAngles | null,
  fps: 0 as number,
  previousAngles: {} as Partial<JointAngles>,
  vectorized: [] as number[],
  poseClass: "unknown",
});

interface PoseStore {
  // 웹캠 데이터
  webcam: ReturnType<typeof createSourceState>;

  // 이미지 데이터
  image1: ReturnType<typeof createSourceState>;
  image2: ReturnType<typeof createSourceState>;

  // 영상 데이터
  video: ReturnType<typeof createSourceState>;

  setPreviousAngles: (
    source: "webcam" | "video" | "image1" | "image2",
    angles: Partial<JointAngles>
  ) => void;

  setWebcamData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
    poseClass: string,
  ) => void;

  setImage1Data: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
    poseClass: string,
  ) => void;
  
  setImage2Data: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
    poseClass: string,
  ) => void;

  setVideoData: (
    landmarks: Landmark[],
    angles: JointAngles,
    fps: number,
    vectorized: number[],
    poseClass: string,
  ) => void;

  resetAllData: () => void;
  resetWebcam: () => void;
  resetImage1: () => void;
  resetImage2: () => void;
  resetVideo: () => void;
}

const initialState: Omit<
  PoseStore,
  | "setPreviousAngles"
  | "setWebcamData"
  | "setImage1Data"
  | "setImage2Data"
  | "setVideoData"
  | "resetAllData"
  | "resetImage1"
  | "resetImage2"
  | "resetWebcam"
  | "resetVideo"
> = {
  webcam: createSourceState(),
  image1: createSourceState(),
  image2: createSourceState(),
  video: createSourceState(),
};

export const usePoseStore = create<PoseStore>((set) => ({
  ...initialState,

  setPreviousAngles: (source, angles) =>
    set((state) => ({
      [source]: { ...state[source], previousAngles: angles },
    })),

  setWebcamData: (landmarks, angles, fps, vectorized, poseClass) =>
    set((_) => ({
      webcam: { landmarks, angles, fps, previousAngles: {}, vectorized, poseClass },
    })),

  setImage1Data: (landmarks, angles, fps, vectorized, poseClass) =>
    set((state) => ({ image1: { landmarks, angles, fps, previousAngles: {}, vectorized, poseClass } })),
  
  setImage2Data: (landmarks, angles, fps, vectorized, poseClass) =>
    set((state) => ({ image2: { landmarks, angles, fps, previousAngles: {}, vectorized, poseClass } })),

  setVideoData: (landmarks, angles, fps, vectorized, poseClass) =>
    set((_) => ({
      video: { landmarks, angles, fps, previousAngles: {}, vectorized, poseClass },
    })),

  resetImage1: () => set({ image1: createSourceState() }),
  resetImage2: () => set({ image2: createSourceState() }),
  resetWebcam: () => set({ webcam: createSourceState() }),
  resetVideo: () => set({ video: createSourceState() }),

  resetAllData: () => set(initialState),
}));
