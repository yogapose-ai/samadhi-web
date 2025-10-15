import type { Landmark, JointAngles } from "@/types/pose";

// MediaPipe 랜드마크 인덱스 (총 33개 중 각도 계산에 필요한 주요 랜드마크만 정의)
export const LANDMARK_INDICES = {
  // 머리/목
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  NOSE: 0,

  // 팔
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,

  // 몸통/고관절
  LEFT_HIP: 23,
  RIGHT_HIP: 24,

  // 다리
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
} as const;

const MIN_VISIBILITY = 0.5; // visibility 임계값
const DEAD_ZONE = 2.0; // 2도 이하 변화는 무시

/**
 * 3D 공간에서 3점으로 각도 계산
 */
function calculateAngle3D(
  a: Landmark,
  b: Landmark,
  c: Landmark
): number | null {
  if (
    (a.visibility || 0) < MIN_VISIBILITY ||
    (b.visibility || 0) < MIN_VISIBILITY ||
    (c.visibility || 0) < MIN_VISIBILITY
  ) {
    return null; // 안 보이는 랜드마크는 계산하지 않음
  }

  // 벡터 BA와 BC
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  // 내적
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;

  // 벡터 크기
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBA === 0 || magBC === 0) {
    return null;
  }

  // 각도 계산
  const cosAngle = dot / (magBA * magBC);

  const angle =
    (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;

  return Math.round(angle * 10) / 10;
}

/**
 * 데드존 필터 적용
 */
function applyDeadZone(
  key: keyof JointAngles,
  newAngle: number,
  previousAngles: Partial<JointAngles>,
  updatePreviousAngles: (key: keyof JointAngles, angle: number) => void
): number {
  const prevAngle = previousAngles[key];

  if (prevAngle === undefined || Object.keys(previousAngles).length === 0) {
    updatePreviousAngles(key, newAngle);
    return newAngle;
  }

  const diff = Math.abs(newAngle - prevAngle);

  // 변화가 데드존 이하면 이전 값 유지 (떨림 방지)
  if (diff < DEAD_ZONE) {
    return prevAngle;
  }

  // 변화가 크면 새 값으로 업데이트
  updatePreviousAngles(key, newAngle);
  return newAngle;
}

/**
 * 각도 계산 헬퍼 (null 처리 + 데드존)
 */
function calcAngle(
  key: keyof JointAngles,
  a: Landmark,
  b: Landmark,
  c: Landmark,
  prevAngles: Partial<JointAngles>,
  updatePrevAngles: (key: keyof JointAngles, angle: number) => void
): number {
  const angle = calculateAngle3D(a, b, c);

  if (angle === null) {
    // visibility 낮으면 이전 값 유지
    return prevAngles[key] ?? 0;
  }

  return applyDeadZone(key, angle, prevAngles, updatePrevAngles);
}

/**
 * 중앙점 계산
 */
function getMidpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility || 1, b.visibility || 1),
  };
}

/**
 * 모든 주요 관절 각도 계산
 */
export function calculateAllAngles(
  landmarks: Landmark[],
  currentPreviousAngles: Partial<JointAngles>,
  setAllPreviousAngles: (angles: JointAngles) => void
): JointAngles {
  if (landmarks.length < 33) {
    throw new Error("Invalid landmarks: expected 33 points");
  }

  const calculatedAngles: JointAngles = {} as JointAngles;

  const tempPreviousAngles = { ...currentPreviousAngles } as JointAngles;

  const updatePrevious = (key: keyof JointAngles, angle: number) => {
    tempPreviousAngles[key] = angle;
  };

  const centerShoulder = getMidpoint(
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER]
  );
  const centerHip = getMidpoint(
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    landmarks[LANDMARK_INDICES.RIGHT_HIP]
  );
  const centerKnee = getMidpoint(
    landmarks[LANDMARK_INDICES.LEFT_KNEE],
    landmarks[LANDMARK_INDICES.RIGHT_KNEE]
  );

  /*------------ 팔 ------------*/
  // 왼쪽 팔꿈치: 어깨(11) - 팔꿈치(13) - 손목(15)
  calculatedAngles.leftElbow = calcAngle(
    "leftElbow",
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.LEFT_ELBOW],
    landmarks[LANDMARK_INDICES.LEFT_WRIST],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 팔꿈치: 어깨(12) - 팔꿈치(14) - 손목(16)
  calculatedAngles.rightElbow = calcAngle(
    "rightElbow",
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
    landmarks[LANDMARK_INDICES.RIGHT_WRIST],
    tempPreviousAngles,
    updatePrevious
  );

  // 왼쪽 어깨: 팔꿈치(13) - 어깨(11) - 골반(23)
  calculatedAngles.leftShoulder = calcAngle(
    "leftShoulder",
    landmarks[LANDMARK_INDICES.LEFT_ELBOW],
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 어깨: 팔꿈치(14) - 어깨(12) - 엉덩이(24)
  calculatedAngles.rightShoulder = calcAngle(
    "rightShoulder",
    landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_HIP],
    tempPreviousAngles,
    updatePrevious
  );

  /*------------ 다리 ------------*/
  // 왼쪽 무릎: 골반(23) - 무릎(25) - 발목(27)
  calculatedAngles.leftKnee = calcAngle(
    "leftKnee",
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    landmarks[LANDMARK_INDICES.LEFT_KNEE],
    landmarks[LANDMARK_INDICES.LEFT_ANKLE],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 무릎: 엉덩이(24) - 무릎(26) - 발목(28)
  calculatedAngles.rightKnee = calcAngle(
    "rightKnee",
    landmarks[LANDMARK_INDICES.RIGHT_HIP],
    landmarks[LANDMARK_INDICES.RIGHT_KNEE],
    landmarks[LANDMARK_INDICES.RIGHT_ANKLE],
    tempPreviousAngles,
    updatePrevious
  );

  // 왼쪽 엉덩이: 어깨(11) - 엉덩이(23) - 무릎(25)
  calculatedAngles.leftHip = calcAngle(
    "leftHip",
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    landmarks[LANDMARK_INDICES.LEFT_KNEE],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 엉덩이: 어깨(12) - 엉덩이(24) - 무릎(26)
  calculatedAngles.rightHip = calcAngle(
    "rightHip",
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_HIP],
    landmarks[LANDMARK_INDICES.RIGHT_KNEE],
    tempPreviousAngles,
    updatePrevious
  );

  /*------------ 몸통 ------------*/
  // 척추: 어깨 중앙점 - 골반 중앙점 - 무릎 중앙점
  calculatedAngles.spine = calcAngle(
    "spine",
    centerShoulder,
    centerHip,
    centerKnee,
    tempPreviousAngles,
    updatePrevious
  );

  // 왼쪽 정렬: 어깨(11) - 엉덩이(23) - 오른쪽 엉덩이(24)
  calculatedAngles.leftHipShoulderAlign = calcAngle(
    "leftHipShoulderAlign",
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    landmarks[LANDMARK_INDICES.RIGHT_HIP],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 정렬: 어깨(12) - 엉덩이(24) - 왼쪽 엉덩이(23)
  calculatedAngles.rightHipShoulderAlign = calcAngle(
    "rightHipShoulderAlign",
    landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
    landmarks[LANDMARK_INDICES.RIGHT_HIP],
    landmarks[LANDMARK_INDICES.LEFT_HIP],
    tempPreviousAngles,
    updatePrevious
  );

  /*------------ 손목 ------------*/
  // 왼쪽 손목: 팔꿈치(13) - 손목(15) - 손가락(19)
  calculatedAngles.leftWrist = calcAngle(
    "leftWrist",
    landmarks[LANDMARK_INDICES.LEFT_ELBOW],
    landmarks[LANDMARK_INDICES.LEFT_WRIST],
    landmarks[LANDMARK_INDICES.LEFT_INDEX],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 손목: 팔꿈치(14) - 손목(16) - 손가락(20)
  calculatedAngles.rightWrist = calcAngle(
    "rightWrist",
    landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
    landmarks[LANDMARK_INDICES.RIGHT_WRIST],
    landmarks[LANDMARK_INDICES.RIGHT_INDEX],
    tempPreviousAngles,
    updatePrevious
  );

  /*------------ 발목 ------------*/
  // 왼쪽 발목: 무릎(25) - 발목(27) - 발뒤꿈치(29)
  calculatedAngles.leftAnkle = calcAngle(
    "leftAnkle",
    landmarks[LANDMARK_INDICES.LEFT_KNEE],
    landmarks[LANDMARK_INDICES.LEFT_ANKLE],
    landmarks[LANDMARK_INDICES.LEFT_HEEL],
    tempPreviousAngles,
    updatePrevious
  );

  // 오른쪽 발목: 무릎(26) - 발목(28) - 발뒤꿈치(30)
  calculatedAngles.rightAnkle = calcAngle(
    "rightAnkle",
    landmarks[LANDMARK_INDICES.RIGHT_KNEE],
    landmarks[LANDMARK_INDICES.RIGHT_ANKLE],
    landmarks[LANDMARK_INDICES.RIGHT_HEEL],
    tempPreviousAngles,
    updatePrevious
  );

  /*------------ 머리 위치 ------------*/
  // 목 각도: 어깨(11) - 귀(7) - 코(0)
  calculatedAngles.neckAngle = calcAngle(
    "neckAngle",
    landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
    landmarks[LANDMARK_INDICES.LEFT_EAR],
    landmarks[LANDMARK_INDICES.NOSE],
    tempPreviousAngles,
    updatePrevious
  );
  setAllPreviousAngles(tempPreviousAngles);

  return calculatedAngles;
}

export function CalculateSimilarity(P1: number[], P2: number[]): number {
  const n = P1.length;

  if (n !== P2.length || n === 0) {
    return 0;
  }

  // 내적과 노름
  let dot = 0;
  let sum1 = 0;
  let sum2 = 0;
  let diffSum = 0;

  for (let i = 0; i < n; i++) {
    const a = P1[i];
    const b = P2[i];

    dot += a * b;
    sum1 += a * a;
    sum2 += b * b;
    const d = a - b;
    diffSum += d * d;
  }

  const mag1 = Math.sqrt(sum1);
  const mag2 = Math.sqrt(sum2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  // 1) 코사인 유사도 (클램프)
  let cosine = dot / (mag1 * mag2);
  if (cosine > 1) {
    cosine = 1;
  } else if (cosine < -1) {
    cosine = -1;
  }
  const cosineScore = ((cosine + 1) / 2) * 100; // 코사인 점수 -> 방향

  // 2) 유클리드 거리 정규화 -> notion 계산공식
  const diff = Math.sqrt(diffSum);
  const normDiff = diff / (mag1 + mag2 + 1e-12); // 0~1 근사
  const euclidScore = (1 - normDiff) * 100; // 유클리드 점수 -> 크기

  // 3) 혼합 - 일단 임시: 0.7:0.3
  const mixed = 0.7 * cosineScore + 0.3 * euclidScore;

  // 4) ε 허용 + 반올림
  const eps = 1e-4;
  if (1 - cosine < eps && normDiff < eps) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round(mixed * 1000) / 1000));
}

/*

  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz); // Math.sqrt(dx*dx + dy*dy + dz*dz)와 동일
*/

function l2norm(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function l2norm1d(arr: number[], eps = 1e-6) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  return Math.sqrt(sum) + eps;
}

function std(array: number[]) {
  const mean = array.reduce((a, b) => a + b, 0) / array.length;
  const variance =
    array.reduce((a, b) => a + (b - mean) ** 2, 0) / array.length;
  return Math.sqrt(variance);
}

/**
 * 3D 관절 좌표 시퀀스의 Jitter 계산
 * @param poseLandmarks 3D 관절 좌표 시퀀스
 * @returns 평균 Jitter 값 (낮을수록 안정적)
 */
export function calcJitter(poseLandmarks: Landmark[][]) {
  const frameDiffs = [];

  for (let i = 1; i < poseLandmarks.length; i++) {
    const prev = poseLandmarks[i - 1];
    const curr = poseLandmarks[i];

    // 각 관절의 프레임 간 유클리드 거리
    const distances = curr.map((joint, j) => {
      const dx = joint.x - prev[j].x;
      const dy = joint.y - prev[j].y;
      const dz = joint.z - prev[j].z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });

    frameDiffs.push(distances);
  }

  // 관절별 jitter (표준편차)
  const joints = frameDiffs[0].length;
  const jitterPerJoint = Array(joints).fill(0);

  for (let j = 0; j < joints; j++) {
    const diffs = frameDiffs.map((f) => f[j]);
    jitterPerJoint[j] = std(diffs);
  }

  return jitterPerJoint.reduce((a, b) => a + b, 0) / jitterPerJoint.length;
}

/**
 * 전처리 전 후 Jitter 비교
 * @param landmarksA 전처리하기 전 3D 관절 좌표 시퀀스
 */
export function getJitter3D(landmarksA: Landmark[][]) {
  const jitterA = calcJitter(landmarksA); //전처리 전

  const landmarksB: Landmark[][] = []; //전처리 후 좌표값
  //각 시퀀스에 대해 전처리 수행
  for (let i = 0; i < landmarksA.length; i++) {
    const landmarks = landmarksA[i];
    const LHIP: Landmark = {
      x: landmarks[LANDMARK_INDICES.LEFT_HIP].x,
      y: landmarks[LANDMARK_INDICES.LEFT_HIP].y,
      z: landmarks[LANDMARK_INDICES.LEFT_HIP].z,
    };
    const RHIP: Landmark = {
      x: landmarks[LANDMARK_INDICES.RIGHT_HIP].x,
      y: landmarks[LANDMARK_INDICES.RIGHT_HIP].y,
      z: landmarks[LANDMARK_INDICES.RIGHT_HIP].z,
    };
    const LSHO: Landmark = {
      x: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].x,
      y: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].y,
      z: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].z,
    };
    const RSHO: Landmark = {
      x: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].x,
      y: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].y,
      z: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].z,
    };

    const anchor = getMidpoint(LHIP, RHIP);
    const scale = l2norm(LSHO, RSHO);
    const normalized = landmarks.map((mark: Landmark) => {
      if ((mark.visibility || 0) < MIN_VISIBILITY) {
        return { x: 0, y: 0, z: 0 };
      }
      return {
        x: (mark.x - anchor.x) / scale,
        y: (mark.y - anchor.y) / scale,
        z: (mark.z - anchor.z) / scale,
      };
    });

    const flatData = normalized.flatMap((mark) => [mark.x, mark.y, mark.z]);
    const norm = l2norm1d(flatData);
    const finalData = normalized.map((mark) => ({
      x: mark.x / norm,
      y: mark.y / norm,
      z: mark.z / norm,
    }));
    landmarksB.push(finalData);
  }

  const jitterB = calcJitter(landmarksB); //전처리 후 jitter 계산

  console.log("(전처리 전)", jitterA);
  console.log("(전처리 후)", jitterB);
}

export function vectorize(
  landmarks: Landmark[],
  height: number,
  width: number
) {
  //픽셀 값 확인
  // console.log('height: ', height);

  //전처리 전 좌표값을 1차원 벡터로 변경

  //픽셀 단위로 변환한 좌표값
  const LHIP: Landmark = {
    x: landmarks[LANDMARK_INDICES.LEFT_HIP].x * width,
    y: landmarks[LANDMARK_INDICES.LEFT_HIP].y * height,
    z: landmarks[LANDMARK_INDICES.LEFT_HIP].z * width,
  };
  const RHIP: Landmark = {
    x: landmarks[LANDMARK_INDICES.RIGHT_HIP].x * width,
    y: landmarks[LANDMARK_INDICES.RIGHT_HIP].y * height,
    z: landmarks[LANDMARK_INDICES.RIGHT_HIP].z * width,
  };
  const LSHO: Landmark = {
    x: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].x * width,
    y: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].y * height,
    z: landmarks[LANDMARK_INDICES.LEFT_SHOULDER].z * width,
  };
  const RSHO: Landmark = {
    x: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].x * width,
    y: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].y * height,
    z: landmarks[LANDMARK_INDICES.RIGHT_SHOULDER].z * width,
  };

  const anchor = getMidpoint(LHIP, RHIP);
  const scale = l2norm(LSHO, RSHO);

  //랜드마크에 대해 픽셀 단위로 변환
  const data = landmarks.map((mark: Landmark) => {
    if ((mark.visibility || 0) < MIN_VISIBILITY) {
      return [0, 0, 0];
    }
    return [
      (mark.x * width - anchor.x) / scale,
      (mark.y * height - anchor.y) / scale,
      (mark.z * width - anchor.z) / scale,
    ];
  });

  // console.log('data', data.flat());
  // const norm = l2norm1d(data.flat());
  // const result = data.flat().map((d) => d / norm);
  const result = data.flat();

  return result;
}
