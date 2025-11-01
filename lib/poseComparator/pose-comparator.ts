import { CalculateCosAndEuc, calculateAllAngles, CosAndEuc, vectorize, CosAndEucEmpty } from '@/lib/medaipipe/angle-calculator';
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { classifyPose } from "../poseClassifier/pose-classifier";
import { JointAngles } from "@/types/pose.types";

// 이미지 경로로부터 HTMLImageElement 생성
export const createImageFromPath = (path: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));

      img.src = path;
    });
  };

// 이미지 좌우 반전 함수
export const flipHorizontal = (img: HTMLImageElement): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx)
        return reject(new Error('CanvasRenderingContext2D not available'));

      // 좌우 반전
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        if (!blob)
          return reject(new Error('Failed to create blob from canvas'));
        const url = URL.createObjectURL(blob);
        const flipped = new Image();
        flipped.onload = () => resolve(flipped);
        flipped.onerror = (e) => reject(e);
        flipped.src = url;
      }, 'image/png');
    });
  };

// 이미지에서 랜드마크 추출 및 벡터화
export const calculateAngleAndVectorized = async (image: HTMLImageElement, imageLandmarker: PoseLandmarker) => {
    const detectResults = imageLandmarker.detect(image);

    if (!detectResults || !detectResults.landmarks) return null;
    const landmarks = detectResults.landmarks[0];
    const worldLandmarks = detectResults.worldLandmarks?.[0];

    if (!landmarks || !worldLandmarks) return null;
    const angles = calculateAllAngles(worldLandmarks, {}, () => {});
    const vectorized = vectorize(
      landmarks,
      image.naturalHeight,
      image.naturalWidth
    );
    URL.revokeObjectURL(image.src);

    return { angles, vectorized };
  };
  
export type ImagePair = {
    image1: {
        poseAnswer: string;
        path: string;
    };
    image2: {
        poseAnswer: string;
        path: string;
    };
    isSame: number;
}

interface ImageComparatorInput {
    imageList: ImagePair[];
    imageLandmarker: PoseLandmarker;
    onProgress?: (processed: number) => void;
}
export interface PoseAndSimilarityResult {
    image1: {
      poseAnswer: string;
      poseResult: string;
      angles: JointAngles;
      distPerPose: Record<string, number>;
    };
    image2: {
      poseAnswer: string;
      poseResult: string;
      angles: JointAngles;
      distPerPose: Record<string, number>;
    };
    image2_flipped: {
      poseAnswer: string;
      poseResult: string;
      angles: JointAngles;
      distPerPose: Record<string, number>;
    };
    similarity_original: CosAndEuc;
    similarity_flipped: CosAndEuc;
    isSameAnswer: number;
}

// 이미지 쌍에 대해 포즈 분류 및 유사도 계산
export const calculatePoseAndSimilarity = async ({imageList, imageLandmarker, onProgress}: ImageComparatorInput) => {
    const result = [];
    const error_images = new Set<string>();
    for (let i = 0; i < imageList.length; i++) {
      const image1 = await createImageFromPath(imageList[i].image1.path);
      const image2 = await createImageFromPath(imageList[i].image2.path);
      const image2_flipped = await flipHorizontal(image2); // 좌우 반전 이미지 생성

      const result1 = await calculateAngleAndVectorized(image1, imageLandmarker);
      const result2 = await calculateAngleAndVectorized(image2, imageLandmarker);
      const result2_flipped = await calculateAngleAndVectorized(image2_flipped, imageLandmarker);

      if (!result1 || !result2 || !result2_flipped) {
        if (!result1) error_images.add(imageList[i].image1.path);
        if (!result2) error_images.add(imageList[i].image2.path);
        continue;
      }

      // pose classification
      const poseResult1 = classifyPose(result1.angles);
      const poseResult2 = classifyPose(result2.angles);
      const poseResult2_flipped = classifyPose(result2_flipped.angles);

      // similarity calculation
      const similarity_original = CalculateCosAndEuc(
        result1.vectorized,
        result2.vectorized,
      ) ?? CosAndEucEmpty;
      const similarity_flipped = CalculateCosAndEuc(
        result1.vectorized,
        result2_flipped.vectorized,
      ) ?? CosAndEucEmpty;
      
      result.push({
        image1: {
          poseAnswer: imageList[i].image1.poseAnswer,
          poseResult: poseResult1.bestPose,
          angles: result1.angles,
          distPerPose: poseResult1.distPerPose,
        },
        image2: {
          poseAnswer: imageList[i].image2.poseAnswer,
          poseResult: poseResult2.bestPose,
          angles: result2.angles,
          distPerPose: poseResult2.distPerPose,
        },
        image2_flipped: {
          poseAnswer: imageList[i].image2.poseAnswer,
          poseResult: poseResult2_flipped.bestPose,
          angles: result2_flipped.angles,
          distPerPose: poseResult2_flipped.distPerPose,
        },
        similarity_original: similarity_original,
        similarity_flipped: similarity_flipped,
        isSameAnswer: imageList[i].isSame,
      });
        onProgress?.(i + 1);
    }
    
    console.log('Error images:', Array.from(error_images));

    return result;
  };