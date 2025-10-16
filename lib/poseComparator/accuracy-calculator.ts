import { CalculateMixedScore } from "../medaipipe/angle-calculator";
import { PoseAndSimilarityResult } from "./pose-comparator";

// Threshold 정확도 타입 정의
export interface ThresholdAccuracy {
    threshold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: {
      tp: number;
      tn: number;
      fp: number;
      fn: number;
    };
  }
  
  // Threshold별 정확도 계산 함수
export const calculateThresholdAccuracy = (results: PoseAndSimilarityResult[], lambda: number) : ThresholdAccuracy[] => {
    // lambda에 따른 similarity mixedScore 계산
    const mixedScoreList = [] as number[];
    results.forEach(result => {
        const mixedScore_original = CalculateMixedScore(result.similarity_original, lambda);
        const mixedScore_flipped = CalculateMixedScore(result.similarity_flipped, lambda);
        const mixedScore = Math.max(mixedScore_original, mixedScore_flipped);
        mixedScoreList.push(mixedScore);
    });
    
    const thresholdAccuracies = [];
    
    for (let threshold = 0; threshold <= 100; threshold += 1) {
      let tp = 0, tn = 0, fp = 0, fn = 0;
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const mixedScore = mixedScoreList[i];
        const predicted = mixedScore >= threshold ? 1 : 0;
        const actual = result.isSameAnswer;
        
        if (actual === 1 && predicted === 1) tp++;
        else if (actual === 0 && predicted === 0) tn++;
        else if (actual === 0 && predicted === 1) fp++;
        else if (actual === 1 && predicted === 0) fn++;
      }
      
      const accuracy = (tp + tn) / (tp + tn + fp + fn);
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
      
      thresholdAccuracies.push({
        threshold,
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix: { tp, tn, fp, fn }
      });
    }
    
    return thresholdAccuracies;
  };
  
  // 최고 정확도 찾기
export const findBestThreshold = (thresholdAccuracies: ThresholdAccuracy[]) : ThresholdAccuracy => {
    return thresholdAccuracies.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
  };