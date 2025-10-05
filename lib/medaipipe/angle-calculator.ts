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

/**
 * 3D 공간에서 3점으로 각도 계산
 */
export function calculateAngle3D(
  a: Landmark,
  b: Landmark,
  c: Landmark
): number {
  // 벡터 BA와 BC
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  // 내적
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;

  // 벡터 크기
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  // 각도 계산
  const cosAngle = dot / (magBA * magBC);
  const angle =
    (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;

  return Math.round(angle * 10) / 10;
}

/**
 * 모든 주요 관절 각도 계산
 */
export function calculateAllAngles(landmarks: Landmark[]): JointAngles {
  if (landmarks.length < 33) {
    throw new Error("Invalid landmarks: expected 33 points");
  }

  // 척추/몸통 계산에 사용할 중앙점
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

  return {
    /*------------ 팔 ------------*/
    // 왼쪽 팔꿈치: 어깨(11) - 팔꿈치(13) - 손목(15)
    leftElbow: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
      landmarks[LANDMARK_INDICES.LEFT_ELBOW],
      landmarks[LANDMARK_INDICES.LEFT_WRIST]
    ),

    // 오른쪽 팔꿈치: 어깨(12) - 팔꿈치(14) - 손목(16)
    rightElbow: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
      landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
      landmarks[LANDMARK_INDICES.RIGHT_WRIST]
    ),

    // 왼쪽 어깨: 팔꿈치(13) - 어깨(11) - 골반(23)
    leftShoulder: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_ELBOW],
      landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
      landmarks[LANDMARK_INDICES.LEFT_HIP]
    ),

    // 오른쪽 어깨: 팔꿈치(14) - 어깨(12) - 엉덩이(24)
    rightShoulder: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
      landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
      landmarks[LANDMARK_INDICES.RIGHT_HIP]
    ),

    /*------------ 다리 ------------*/
    // 왼쪽 무릎: 골반(23) - 무릎(25) - 발목(27)
    leftKnee: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_HIP],
      landmarks[LANDMARK_INDICES.LEFT_KNEE],
      landmarks[LANDMARK_INDICES.LEFT_ANKLE]
    ),

    // 오른쪽 무릎: 엉덩이(24) - 무릎(26) - 발목(28)
    rightKnee: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_HIP],
      landmarks[LANDMARK_INDICES.RIGHT_KNEE],
      landmarks[LANDMARK_INDICES.RIGHT_ANKLE]
    ),

    // 왼쪽 엉덩이: 어깨(11) - 엉덩이(23) - 무릎(25)
    leftHip: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
      landmarks[LANDMARK_INDICES.LEFT_HIP],
      landmarks[LANDMARK_INDICES.LEFT_KNEE]
    ),

    // 오른쪽 엉덩이: 어깨(12) - 엉덩이(24) - 무릎(26)
    rightHip: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
      landmarks[LANDMARK_INDICES.RIGHT_HIP],
      landmarks[LANDMARK_INDICES.RIGHT_KNEE]
    ),

    /*------------ 몸통 ------------*/
    // 척추: 어깨 중앙점 - 골반 중앙점 - 무릎 중앙점
    spine: calculateAngle3D(centerShoulder, centerHip, centerKnee),

    // 왼쪽 정렬: 어깨(11) - 엉덩이(23) - 오른쪽 엉덩이(24)
    leftHipShoulderAlign: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
      landmarks[LANDMARK_INDICES.LEFT_HIP],
      landmarks[LANDMARK_INDICES.RIGHT_HIP]
    ),

    // 오른쪽 정렬: 어깨(12) - 엉덩이(24) - 왼쪽 엉덩이(23)
    rightHipShoulderAlign: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_SHOULDER],
      landmarks[LANDMARK_INDICES.RIGHT_HIP],
      landmarks[LANDMARK_INDICES.LEFT_HIP]
    ),

    /*------------ 손목 ------------*/
    // 왼쪽 손목: 팔꿈치(13) - 손목(15) - 손가락(19)
    leftWrist: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_ELBOW],
      landmarks[LANDMARK_INDICES.LEFT_WRIST],
      landmarks[LANDMARK_INDICES.LEFT_INDEX]
    ),

    // 오른쪽 손목: 팔꿈치(14) - 손목(16) - 손가락(20)
    rightWrist: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_ELBOW],
      landmarks[LANDMARK_INDICES.RIGHT_WRIST],
      landmarks[LANDMARK_INDICES.RIGHT_INDEX]
    ),

    /*------------ 발목 ------------*/
    // 왼쪽 발목: 무릎(25) - 발목(27) - 발뒤꿈치(29)
    leftAnkle: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_KNEE],
      landmarks[LANDMARK_INDICES.LEFT_ANKLE],
      landmarks[LANDMARK_INDICES.LEFT_HEEL]
    ),

    // 오른쪽 발목: 무릎(26) - 발목(28) - 발뒤꿈치(30)
    rightAnkle: calculateAngle3D(
      landmarks[LANDMARK_INDICES.RIGHT_KNEE],
      landmarks[LANDMARK_INDICES.RIGHT_ANKLE],
      landmarks[LANDMARK_INDICES.RIGHT_HEEL]
    ),

    /*------------ 머리 위치 ------------*/
    // 목 각도: 어깨(11) - 귀(7) - 코(0)
    neckAngle: calculateAngle3D(
      landmarks[LANDMARK_INDICES.LEFT_SHOULDER],
      landmarks[LANDMARK_INDICES.LEFT_EAR],
      landmarks[LANDMARK_INDICES.NOSE]
    ),
  } as JointAngles;
}

function getMidpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility || 1, b.visibility || 1),
  };
}
