export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface JointAngles {
  /*------------ 팔 ------------*/
  // 팔을 굽힌 정도
  leftElbow: number; // 왼쪽 팔꿈치 각도 (왼쪽 어깨-팔꿈치-손목)
  rightElbow: number; // 오른쪽 팔꿈치 각도 (오른쪽 어깨-팔꿈치-손목)

  // 팔을 몸통에서 벌리거나 들어 올린 정도
  leftShoulder: number; // 왼쪽 어깨 각도 (왼쪽 엉덩이-어깨-팔꿈치)
  rightShoulder: number; // 오른쪽 어깨 각도 (오른쪽 엉덩이-어깨-팔꿈치)

  /*------------ 다리 ------------*/
  // 다리를 굽힌 정도
  leftKnee: number; // 왼쪽 무릎 각도 (왼쪽 엉덩이-무릎-발목)
  rightKnee: number; // 오른쪽 무릎 각도 (오른쪽 엉덩이-무릎-발목)

  // 고관절, 상체와 다리의 굽힘 정도
  leftHip: number; // 왼쪽 엉덩이 각도 (왼쪽 어깨-엉덩이-무릎)
  rightHip: number; // 오른쪽 엉덩이 각도 (오른쪽 어깨-엉덩이-무릎)

  /*------------ 몸통 ------------*/
  // 몸을 앞으로 숙이거나 뒤로 젖힌 정도
  spine: number; // 척추 각도 (양쪽 어깨 중앙-엉덩이 중앙을 연결하는 축의 기울기)

  // 몸통의 좌우 기울임 정도 (측면 정렬)
  leftHipShoulderAlign: number; // 왼쪽 정렬 각도 (왼쪽 어깨-왼쪽 엉덩이-오른쪽 엉덩이)
  rightHipShoulderAlign: number; // 오른쪽 정렬 각도 (오른쪽 어깨-오른쪽 엉덩이-왼쪽 엉덩이)

  /*------------ 손목 ------------*/
  // 손목이 꺾인 정도
  leftWrist: number; // 왼쪽 손목 각도 (왼쪽 팔꿈치-손목-손가락 끝)
  rightWrist: number; // 오른쪽 손목 각도 (오른쪽 팔꿈치-손목-손가락 끝)

  /*------------ 발목 ------------*/
  // 발목이 굽혀진 정도
  leftAnkle: number; // 왼쪽 발목 각도 (왼쪽 무릎-발목-발뒤꿈치)
  rightAnkle: number; // 오른쪽 발목 각도 (오른쪽 무릎-발목-발뒤꿈치)

  /*------------ 머리 위치 ------------*/
  // 거북목 정도
  neckAngle: number; // 목 각도 (왼쪽 어깨-귀-코)
}
