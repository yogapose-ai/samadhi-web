import { ImageComparatorOutput } from "./pose-comparator";

// 결과를 테이블(평탄화) 행으로 변환
export type ImageComparatorFlatRow = {
    image1PoseAnswer: string;
    image1PoseResult: string;
    image2PoseAnswer: string;
    image2PoseResult: string;
    cosine: number;
    euclid: number; // diff
    mixed: number; // mixedScore
    isSameAnswer: number;
    isSameResult: number;
};
  
export const toFlatRows = (results: ImageComparatorOutput[]): ImageComparatorFlatRow[] => {
    return results.map(r => ({
      image1PoseAnswer: r.image1.poseAnswer,
      image1PoseResult: r.image1.poseResult,
      image2PoseAnswer: r.image2.poseAnswer,
      image2PoseResult: r.image2.poseResult,
      cosine: r.similarity?.cosine ?? 0,
      euclid: r.similarity?.diff ?? 0,
      mixed: r.similarity?.mixedScore ?? 0,
      isSameAnswer: r.isSameAnswer,
      isSameResult: r.isSameResult,
    }));
};
  
// CSV 문자열 생성
export const toCSV = (rows: ImageComparatorFlatRow[]): string => {
    const header = [
      'image1PoseAnswer',
      'image1PoseResult',
      'image2PoseAnswer',
      'image2PoseResult',
      'cosine',
      'euclid',
      'mixed',
      'isSameAnswer',
      'isSameResult',
    ];
    const escape = (val: unknown) => {
      const s = String(val ?? '');
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([
        escape(row.image1PoseAnswer),
        escape(row.image1PoseResult),
        escape(row.image2PoseAnswer),
        escape(row.image2PoseResult),
        row.cosine,
        row.euclid,
        row.mixed,
        row.isSameAnswer,
        row.isSameResult,
      ].join(','));
    }
    return lines.join('\n');
};
  
// 브라우저에서 파일 저장 (CSV/JSON)
export const saveBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};
  
export const saveAsCSV = (results: ImageComparatorOutput[], filename = 'pose-compare.csv') => {
    const csv = toCSV(toFlatRows(results));
    saveBlob(csv, 'text/csv', filename);
};
  
export const saveAsJSON = (results: ImageComparatorOutput[], filename = 'pose-compare.json') => {
    const json = JSON.stringify(results, null, 2);
    saveBlob(json, 'application/json', filename);
};