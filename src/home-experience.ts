import type { Save } from './rules';

export const HOME_EXIT = { x: 0, z: 26 };
// Coordinates are local to the southern activity group (z offset 10).
export const HOME_PROJECT_SPOTS = [[-8,13],[-6,15.7],[5,16.3]] as const;
export const HOME_VISITORS = ['강아지 단추', '가현이', '오지후'] as const;
export function atHomeExit(x: number, z: number) {
  return Math.hypot(x-HOME_EXIT.x,z-HOME_EXIT.z) < 3.2;
}

// Only describe things the visitor can actually find in this save.
export const VISITOR_LINES = {
  welcome: ['와, 정말 잘 꾸몄다! 네가 고른 자리마다 네 마음이 보여.', '초대해 줘서 고마워. 천천히 구경해도 될까?', '여기는 네가 주인공인 작은 쉼터구나!', '다음에 또 놀러 오고 싶어. 정말 편안한 곳이야.'],
  empty: ['아직 빈자리가 많네. 어떤 정원을 만들지 기대돼!', '꽃 한 송이부터 놓아 볼까? 작은 시작도 멋질 거야.', '여기에 네가 좋아하는 물건을 하나씩 놓으면 좋겠다.', '지금은 넓어서 같이 산책하기 좋네. 천천히 꾸며 보자!'],
  flowers: ['꽃이 피어 있어서 정원이 환해 보여!', '꽃밭 옆에서 잠깐 구경해도 될까? 색이 참 예뻐.', '네가 고른 꽃들이 정원에 잘 어울려.', '꽃을 보며 걸으니 기분까지 좋아졌어!'],
  trees: ['나무가 있어서 숲속에 놀러 온 것 같아!', '나뭇잎을 바라보며 잠깐 쉬고 싶어.', '나무 주변을 산책하니 마음이 편안해.', '이 나무가 정원의 멋진 친구가 되어 주네!'],
  bench: ['벤치까지 있네! 구경하다 쉬기 좋겠다.', '앉아서 네 정원을 바라보면 참 좋을 것 같아.', '손님이 쉴 자리도 챙겼구나. 고마워!', '이 벤치 옆에서 다음 모험 이야기를 나누자.'],
  picnic: ['소풍 식탁이 있네! 친구들과 둘러앉기 좋겠다.', '여기서 도시락을 먹으면 작은 소풍이 되겠어.', '식탁을 보니 같이 간식을 나누고 싶어졌어.', '다음에는 친구들과 소풍하러 와도 될까?'],
  water: ['물이 있는 시설을 놓았네. 정원이 더 시원해 보여!', '물가 옆에 잠깐 머물러도 될까?', '정원 속 작은 물 풍경이 눈에 쏙 들어와.', '물을 테마로 꾸민 자리도 정말 멋지다!'],
  playground: ['펫 놀이터가 있네! 동물 친구들이 좋아하겠다.', '펫 친구에게도 놀 공간을 만들어 줬구나!', '놀이터를 보니 나도 함께 놀고 싶어.', '작은 동물까지 생각한 정원이네. 정말 다정하다!'],
  path: ['길을 따라 걸으니 정원을 구경하기 편해!', '네가 만든 길 끝에는 어떤 풍경이 있을까?', '길이 있어서 어디로 가면 될지 잘 알겠어.', '산책길을 따라 천천히 한 바퀴 돌아볼게.'],
  lights: ['정원에 조명도 놓았구나. 작은 장식이 참 예뻐!', '가로등이 산책길의 포인트가 되었네.', '등불을 보니 아늑한 정원이라는 느낌이 들어.', '이 조명 옆은 친구를 기다리기 좋은 자리야.'],
  room: ['집 안에도 가구를 놓았구나! 네 취향이 느껴져.', '모험에서 모은 가구로 방을 꾸몄네. 멋진 추억이야.', '방에 놓을 물건을 직접 고르는 재미가 있겠어!', '네 방은 어떤 모습일지 궁금해. 다음에도 구경하러 올게.'],
  many: ['볼거리가 많아서 한 바퀴 더 돌고 싶어!', '하나씩 정성껏 놓은 게 느껴져. 정말 잘 꾸몄다.', '어느 쪽을 봐도 새로운 물건이 보여서 즐거워.', '네가 만든 정원이 점점 풍성해지고 있네!'],
  dog: ['멍멍! (꼬리를 흔들며 반갑게 인사해요.)', '왈! 왈! (같이 천천히 산책하고 싶은가 봐요.)', '멍! (네 옆에 잠깐 앉아 쉬어요.)', '멍멍! (초대해 줘서 기쁜지 꼬리를 살랑살랑 흔들어요.)'],
  dogFlowers: ['킁킁, 멍! (꽃 근처에서 향기를 맡고 기분 좋게 꼬리를 흔들어요.)', '멍! (꽃을 밟지 않고 옆길로 사뿐사뿐 걸어요.)', '킁킁! (꽃밭을 구경한 뒤 너를 올려다봐요.)', '멍멍! (꽃 옆에서 잠깐 햇볕을 쬐어요.)'],
} as const;

export function visitorLines(s: Save, dog: boolean): string[] {
  const kinds = new Set(s.homestead.objects.map(o => o.kind));
  const has = (...ids: number[]) => ids.some(id => kinds.has(id));
  if (dog) return [...VISITOR_LINES.dog, ...(has(6,7,8,9) ? VISITOR_LINES.dogFlowers : [])];
  return [...VISITOR_LINES.welcome,
    ...(!kinds.size ? VISITOR_LINES.empty : []),
    ...(has(6,7,8,9) ? VISITOR_LINES.flowers : []),
    ...(has(10,11) ? VISITOR_LINES.trees : []),
    ...(has(13,18) ? VISITOR_LINES.bench : []),
    ...(has(14) ? VISITOR_LINES.picnic : []),
    ...(has(12,17) ? VISITOR_LINES.water : []),
    ...(has(15) ? VISITOR_LINES.playground : []),
    ...(has(0,1,2) ? VISITOR_LINES.path : []),
    ...(has(19) ? VISITOR_LINES.lights : []),
    ...(s.room.furniture.length ? VISITOR_LINES.room : []),
    ...(s.homestead.objects.length >= 8 ? VISITOR_LINES.many : [])];
}
export function pickVisitorLine(s: Save, dog: boolean, previous = '', random = Math.random): string {
  const lines = visitorLines(s, dog).filter(line => line !== previous);
  return lines[Math.min(lines.length - 1, Math.max(0, Math.floor(random() * lines.length)))];
}
