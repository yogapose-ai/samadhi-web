import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { calculateAllAngles, CalculateSimilarity, SimilarityResult, vectorize } from "../medaipipe/angle-calculator";
import { classifyPose } from "../poseClassifier/pose-classifier";
import { JointAngles } from "@/types/pose";

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
export const calculateImageAndVectorized = async (image: HTMLImageElement, imageLandmarker: PoseLandmarker) => {
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
  
type ImagePair = {
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
    lambda: number;
    imageList: ImagePair[];
    imageLandmarker: PoseLandmarker;
}

export interface ImageComparatorOutput {
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
    similarity_original: SimilarityResult | null;
    similarity_flipped: SimilarityResult | null;
    similarity: SimilarityResult | null;
    isSameAnswer: number;
    isSameResult: number;
}

// 이미지 쌍에 대해 포즈 분류 및 유사도 계산
export const calculatePoseAndSimilarity = async ({lambda, imageList, imageLandmarker}: ImageComparatorInput) => {
    const result = [];
    for (let i = 0; i < imageList.length; i++) {
      const image1 = await createImageFromPath(imageList[i].image1.path);
      const image2 = await createImageFromPath(imageList[i].image2.path);
      const image2_flipped = await flipHorizontal(image2); // 좌우 반전 이미지 생성

      const result1 = await calculateImageAndVectorized(image1, imageLandmarker);
      const result2 = await calculateImageAndVectorized(image2, imageLandmarker);
      const result2_flipped = await calculateImageAndVectorized(image2_flipped, imageLandmarker);

      if (!result1 || !result2 || !result2_flipped) continue;

      // pose classification
      const poseResult1 = classifyPose(result1.angles);
      const poseResult2 = classifyPose(result2.angles);
      const poseResult2_flipped = classifyPose(result2_flipped.angles);

      // similarity calculation
      const similarity_original = CalculateSimilarity(
        result1.vectorized,
        result2.vectorized
      );
      const similarity_flipped = CalculateSimilarity(
        result1.vectorized,
        result2_flipped.vectorized
      );
      const similarity =
        (similarity_original?.mixedScore || 0) >
        (similarity_flipped?.mixedScore || 0)
          ? similarity_original
          : similarity_flipped;
          
      const isSameResult = similarity?.mixedScore ?? 0 > lambda ? 1 : 0;
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
        similarity: similarity,
        isSameAnswer: imageList[i].isSame,
        isSameResult: isSameResult,
      });
    }

    return result;
  };