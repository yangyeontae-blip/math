import type { SchoolGrade } from './rules';

/** 2026학년도 경산초 2학기 수학 평가계획에서 확인한 수행 초점과 게임 내 대응 기능. */
export interface GyeongsanMathCriterion {
  unit: string;
  standards: string[];
  assessment: string;
  gameSkills: string[];
}

export const GYEONGSAN_MATH_CRITERIA: Record<SchoolGrade, GyeongsanMathCriterion[]> = {
  1: [
    { unit: '100까지의 수', standards: ['2수01-03'], assessment: '100까지 수의 순서와 크기 비교', gameSkills: ['100까지의 수', '수의 순서', '수 비교'] },
    { unit: '규칙 찾기', standards: ['2수02-02'], assessment: '스스로 규칙을 만들고 배열한 뒤 설명하기', gameSkills: ['규칙 만들고 설명하기'] },
  ],
  2: [
    { unit: '곱셈구구', standards: ['2수01-11'], assessment: '그림을 곱셈식으로 나타내고 빠진 곱셈구구 찾기', gameSkills: ['operation:곱셈구구'] },
    { unit: '표와 그래프', standards: ['2수04-02', '2수04-03'], assessment: '원자료를 표와 ○그래프로 나타내고 장점 설명하기', gameSkills: ['원자료로 표와 그래프 만들기', '표와 그래프의 좋은 점'] },
    { unit: '규칙 찾기', standards: ['2수02-01', '2수02-02'], assessment: '모양·수 배열의 규칙을 찾고 새 규칙 만들기', gameSkills: ['무늬 규칙', '수 규칙', '규칙 설명'] },
  ],
  3: [
    { unit: '곱셈', standards: ['4수01-04'], assessment: '곱하는 수가 두 자리 수인 곱셈의 원리와 계산', gameSkills: ['operation:두 자리 수 곱셈'] },
    { unit: '자료와 그림그래프', standards: ['4수04-01'], assessment: '자료를 그림그래프로 나타내고 해석하기', gameSkills: ['curriculum:그림그래프'] },
  ],
  4: [
    { unit: '소수의 덧셈과 뺄셈', standards: ['4수01-13'], assessment: '소수 두 자리·세 자리 수를 읽고 자릿값 이해하기', gameSkills: ['소수의 자릿값', '소수 세 자리 수'] },
    { unit: '자료와 꺾은선그래프', standards: ['4수04-02'], assessment: '꺾은선그래프를 완성하고 변화 해석하기', gameSkills: ['꺾은선그래프', '변화 읽기'] },
  ],
  5: [
    { unit: '합동과 대칭', standards: ['6수03-01'], assessment: '합동인 도형의 대응점·대응변·대응각과 성질 찾기', gameSkills: ['합동', '대응점', '대응변', '대응각의 크기'] },
    { unit: '평균과 가능성', standards: ['6수04-01'], assessment: '평균 계산·비교와 평균으로 빠진 값 구하기', gameSkills: ['평균 구하기', '평균 비교하기', '평균으로 모르는 값 구하기'] },
  ],
  6: [
    { unit: '분수의 나눗셈', standards: ['6수01-11'], assessment: '분수÷자연수·자연수÷분수·분수÷분수 계산과 설명', gameSkills: ['분수÷자연수', '자연수÷분수', '분수÷분수', '분수 나눗셈'] },
    { unit: '공간과 입체', standards: ['6수03-10'], assessment: '자리별 높이로 쌓기나무 수와 위·앞·옆 모습 알아보기', gameSkills: ['쌓기나무 위·앞·옆'] },
  ],
};
