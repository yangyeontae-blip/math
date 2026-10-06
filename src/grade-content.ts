import type { CurriculumQuestion, CurriculumMission, CurriculumVisual } from './curriculum';
import type { CurriculumUnitId, NewCurriculumUnitId, SchoolGrade } from './rules';

export interface GradeRegion { id: CurriculumUnitId; icon: string; name: string; short: string; className: string; semester: '1학기' | '2학기' | '공통' }

type UnitPlan = { icon: string; name: string; short: string; semester: '1학기' | '2학기'; topics: string[] };
type GradePlan = Record<NewCurriculumUnitId, UnitPlan>;

const PLANS: Record<Exclude<SchoolGrade, 3>, GradePlan> = {
  1: {
    plane: { icon: '🔢', name: '9와 50 수마을', short: '9까지의 수에서 50까지의 수', semester: '1학기', topics: ['9까지의 수', '수의 순서', '수 비교', '몇십과 몇', '50까지의 수'] },
    lengthTime: { icon: '🕰️', name: '시계와 규칙길', short: '몇 시·몇 시 30분과 반복 규칙', semester: '2학기', topics: ['몇 시', '몇 시 30분', '하루의 때', '수 규칙', '모양 규칙'] },
    fractionDecimal: { icon: '🧩', name: '모으기 가르기마을', short: '수를 두 수로 모으고 가르기', semester: '1학기', topics: ['수 모으기', '수 가르기', '10 만들기', '빈칸 수', '수 이야기'] },
    circle: { icon: '🔺', name: '알록달록 모양정원', short: '상자·공·둥근기둥과 세모·네모·동그라미', semester: '1학기', topics: ['상자 모양', '공 모양', '둥근기둥 모양', '세모와 네모', '동그라미'] },
    fraction: { icon: '🧱', name: '모양과 위치섬', short: '모양을 쌓고 위치와 순서를 말하기', semester: '2학기', topics: ['모양 쌓기', '위와 아래', '앞과 뒤', '왼쪽과 오른쪽', '몇 번째'] },
    measurement: { icon: '⚖️', name: '비교 저울마을', short: '길이·무게·넓이·들이를 직접 비교', semester: '1학기', topics: ['길이 비교', '무게 비교', '넓이 비교', '들이 비교', '순서 정하기'] },
    pictograph: { icon: '🔢', name: '100까지 수 관측소', short: '100까지의 수와 묶어 세기', semester: '2학기', topics: ['100까지의 수', '10개씩 묶기', '수의 순서', '수 비교', '빈칸 수'] },
  },
  2: {
    plane: { icon: '🔢', name: '천과 만 수마을', short: '세 자리 수와 네 자리 수의 자릿값', semester: '1학기', topics: ['백 알아보기', '세 자리 수', '천 알아보기', '네 자리 수', '수 비교'] },
    lengthTime: { icon: '🕰️', name: '시각과 시간길', short: '몇 시 몇 분·시간·하루·달력', semester: '2학기', topics: ['몇 시 몇 분', '시간의 합', '시간의 차', '하루와 일주일', '달력'] },
    fractionDecimal: { icon: '📏', name: '길이 재기마을', short: 'cm와 m로 재고 길이를 계산', semester: '1학기', topics: ['cm로 재기', '1 m', 'cm와 m', '길이의 합', '길이의 차'] },
    circle: { icon: '🔷', name: '여러 가지 도형정원', short: '삼각형·사각형·원과 쌓기 모양', semester: '1학기', topics: ['삼각형', '사각형', '원', '도형 분류', '쌓기 모양'] },
    fraction: { icon: '🧩', name: '규칙 찾기섬', short: '수·무늬·쌓기에서 규칙 찾기', semester: '2학기', topics: ['수 규칙', '무늬 규칙', '늘어나는 규칙', '줄어드는 규칙', '규칙 설명'] },
    measurement: { icon: '📚', name: '분류하기마을', short: '정한 기준에 따라 자료를 분류', semester: '1학기', topics: ['기준 정하기', '한 기준 분류', '두 기준 분류', '개수 세기', '분류 설명'] },
    pictograph: { icon: '📊', name: '표와 그래프 관측소', short: '자료를 표와 그래프로 나타내고 비교', semester: '2학기', topics: ['표 읽기', '그래프 읽기', '가장 많은 것', '차이 구하기', '자료 이야기'] },
  },
  4: {
    plane: { icon: '🔢', name: '큰 수 별마을', short: '만·억·조와 큰 수의 자릿값', semester: '1학기', topics: ['만', '억', '조', '자릿값', '큰 수 비교'] },
    lengthTime: { icon: '📐', name: '각도와 삼각형길', short: '각도·예각·둔각과 삼각형 분류', semester: '1학기', topics: ['각도', '각도 재기', '예각과 둔각', '삼각형 분류', '각도 계산'] },
    fractionDecimal: { icon: '🧮', name: '혼합계산과 규칙마을', short: '혼합 계산과 규칙·대응 관계', semester: '1학기', topics: ['혼합 계산', '등호', '규칙 찾기', '대응 관계', '식으로 나타내기'] },
    circle: { icon: '🔷', name: '수직·평행·다각형정원', short: '수직과 평행, 다각형의 성질', semester: '2학기', topics: ['수직', '평행', '사각형', '다각형', '대각선'] },
    fraction: { icon: '🍰', name: '분수 계산섬', short: '분모가 같은 분수의 덧셈과 뺄셈', semester: '1학기', topics: ['진분수', '가분수와 대분수', '크기 비교', '분수 덧셈', '분수 뺄셈'] },
    measurement: { icon: '🔟', name: '소수와 어림마을', short: '소수의 덧셈·뺄셈과 올림·버림·반올림', semester: '2학기', topics: ['소수의 자릿값', '소수 덧셈', '소수 뺄셈', '반올림', '수의 범위'] },
    pictograph: { icon: '📈', name: '그래프 관측소', short: '막대그래프와 꺾은선그래프 해석', semester: '2학기', topics: ['막대그래프', '꺾은선그래프', '변화 읽기', '자료 비교', '그래프 해석'] },
  },
  5: {
    plane: { icon: '🔗', name: '약수와 배수마을', short: '약수·배수·공약수·공배수', semester: '1학기', topics: ['약수', '배수', '공약수', '최대공약수', '최소공배수'] },
    lengthTime: { icon: '🧮', name: '혼합계산과 대응길', short: '계산 순서와 규칙·대응 관계', semester: '1학기', topics: ['혼합 계산', '괄호', '계산 순서', '규칙과 대응', '식으로 나타내기'] },
    fractionDecimal: { icon: '🔟', name: '소수 곱셈마을', short: '자연수×소수와 소수×소수', semester: '2학기', topics: ['소수×자연수', '자연수×소수', '소수 한 자리 곱셈', '소수 두 자리 곱셈', '곱의 크기'] },
    circle: { icon: '🪞', name: '합동과 대칭정원', short: '합동·선대칭·점대칭 도형', semester: '2학기', topics: ['합동', '대응점', '대응변', '선대칭', '점대칭'] },
    fraction: { icon: '🍰', name: '분수 연산섬', short: '약분·통분과 분수의 덧셈·뺄셈·곱셈', semester: '1학기', topics: ['약분', '통분', '분수 덧셈', '분수 뺄셈', '분수 곱셈'] },
    measurement: { icon: '📐', name: '측정과 입체마을', short: '수의 범위·어림, 둘레·넓이와 직육면체', semester: '1학기', topics: ['수의 범위와 어림', '다각형 둘레', '다각형 넓이', '직육면체 성질', '직육면체 전개도'] },
    pictograph: { icon: '📊', name: '평균과 가능성관측소', short: '평균을 구하고 가능성을 말로 비교', semester: '2학기', topics: ['평균', '평균으로 합계 구하기', '가능성 비교', '가능성 표현', '자료 해석'] },
  },
  6: {
    plane: { icon: '➗', name: '분수 나눗셈마을', short: '분수÷자연수와 분수÷분수', semester: '1학기', topics: ['분수÷자연수', '자연수÷분수', '분수÷분수', '역수', '분수 나눗셈'] },
    lengthTime: { icon: '🔟', name: '소수 나눗셈길', short: '소수÷자연수와 소수÷소수', semester: '1학기', topics: ['소수÷자연수', '자연수÷소수', '소수÷소수', '몫 어림', '나머지 나타내기'] },
    fractionDecimal: { icon: '⚖️', name: '비와 비율마을', short: '비·비율·백분율을 연결', semester: '1학기', topics: ['비', '비율', '분수로 나타내기', '소수로 나타내기', '백분율'] },
    circle: { icon: '⭕', name: '원의 넓이정원', short: '원주율·원의 둘레·원의 넓이', semester: '2학기', topics: ['원주', '원주율', '원의 둘레', '원의 넓이', '원 활용'] },
    fraction: { icon: '📐', name: '비례식과 비례배분섬', short: '비례식의 성질과 비례배분', semester: '2학기', topics: ['비의 성질', '비례식', '비례식 계산', '비례배분', '생활 속 비례'] },
    measurement: { icon: '🧊', name: '입체도형마을', short: '각기둥·각뿔·공간·원기둥·원뿔·구', semester: '2학기', topics: ['각기둥과 각뿔', '쌓기나무', '원기둥', '원뿔과 구', '겉넓이와 부피'] },
    pictograph: { icon: '📈', name: '여러 가지 그래프관측소', short: '띠그래프·원그래프와 자료 해석', semester: '1학기', topics: ['띠그래프', '원그래프', '백분율 읽기', '자료 비교', '자료 해석'] },
  },
};

const OPS: Record<SchoolGrade, Partial<Record<'addition'|'subtraction'|'multiplication'|'division', GradeRegion>>> = {
  1: { addition: { id:'addition', icon:'🍎', name:'모으기 덧셈숲', short:'9까지와 20까지의 덧셈', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'가르기 뺄셈숲', short:'9까지와 20까지의 뺄셈', className:'subtraction', semester:'2학기' } },
  2: { addition: { id:'addition', icon:'🍎', name:'받아올림 덧셈숲', short:'세 자리 수 범위의 덧셈', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'받아내림 뺄셈숲', short:'세 자리 수 범위의 뺄셈', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'곱셈과 구구단숲', short:'곱셈의 뜻과 2단부터 9단', className:'multiplication', semester:'2학기' } },
  3: {},
  4: { addition: { id:'addition', icon:'🍎', name:'세 자리 덧셈숲', short:'세 자리 수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'세 자리 뺄셈숲', short:'세 자리 수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'큰 수 곱셈숲', short:'두세 자리 수의 곱셈', className:'multiplication', semester:'1학기' }, division: { id:'division', icon:'🌿', name:'큰 수 나눗셈숲', short:'두 자리 수로 나누기', className:'division', semester:'1학기' } },
  5: { addition: { id:'addition', icon:'🍎', name:'수 감각 덧셈숲', short:'큰 수와 소수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'수 감각 뺄셈숲', short:'큰 수와 소수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'분수·소수 곱셈숲', short:'분수와 소수의 곱셈', className:'multiplication', semester:'2학기' }, division: { id:'division', icon:'🌿', name:'나눗셈 전략숲', short:'자연수 나눗셈과 검산', className:'division', semester:'1학기' } },
  6: { addition: { id:'addition', icon:'🍎', name:'분수·소수 덧셈숲', short:'분수와 소수의 덧셈 복습', className:'addition', semester:'1학기' }, subtraction: { id:'subtraction', icon:'🍂', name:'분수·소수 뺄셈숲', short:'분수와 소수의 뺄셈 복습', className:'subtraction', semester:'1학기' }, multiplication: { id:'multiplication', icon:'🌻', name:'분수·소수 곱셈숲', short:'분수와 소수의 곱셈 복습', className:'multiplication', semester:'1학기' }, division: { id:'division', icon:'🌿', name:'분수·소수 나눗셈숲', short:'6학년 핵심 나눗셈', className:'division', semester:'1학기' } },
};

export const GRADE_CURRICULUM_UNITS: Record<SchoolGrade, { first: string[]; second: string[] }> = {
  1: { first: ['9까지의 수','여러 가지 모양','덧셈과 뺄셈','비교하기','50까지의 수'], second: ['100까지의 수','덧셈과 뺄셈','모양과 시각','시계 보기와 규칙 찾기'] },
  2: { first: ['세 자리 수','여러 가지 도형','덧셈과 뺄셈','길이 재기','분류하기','곱셈'], second: ['네 자리 수','곱셈구구','길이 재기','시각과 시간','표와 그래프','규칙 찾기'] },
  3: { first: ['덧셈과 뺄셈','평면도형','나눗셈','곱셈','길이와 시간','분수와 소수'], second: ['곱셈','나눗셈','원','분수','들이와 무게','자료의 정리'] },
  4: { first: ['큰 수','곱셈과 나눗셈','각도와 삼각형','분수의 덧셈과 뺄셈','혼합 계산','막대그래프'], second: ['소수의 덧셈과 뺄셈','수직과 평행','다각형','어림하기','꺾은선그래프','규칙과 대응'] },
  5: { first: ['자연수의 혼합 계산','약수와 배수','규칙과 대응','약분과 통분','분수의 덧셈과 뺄셈','다각형의 둘레와 넓이'], second: ['수의 범위와 어림하기','분수의 곱셈','합동과 대칭','소수의 곱셈','직육면체','평균과 가능성'] },
  6: { first: ['분수의 나눗셈','각기둥과 각뿔','소수의 나눗셈','비와 비율','여러 가지 그래프','직육면체의 겉넓이와 부피'], second: ['분수의 나눗셈','소수의 나눗셈','공간과 입체','비례식과 비례배분','원의 넓이','원기둥·원뿔·구'] },
};

export function gradeRegions(grade: SchoolGrade): { first: GradeRegion[]; second: GradeRegion[] } | null {
  if (grade === 3) return null;
  const plan = PLANS[grade], ops = Object.values(OPS[grade]) as GradeRegion[];
  const extras = (Object.entries(plan) as [NewCurriculumUnitId, UnitPlan][]).map(([id, item]): GradeRegion => ({ id, icon:item.icon, name:item.name, short:item.short, className:id.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), semester:item.semester }));
  return { first: [...ops.filter(x => x.semester === '1학기'), ...extras.filter(x => x.semester === '1학기')], second: [...ops.filter(x => x.semester === '2학기'), ...extras.filter(x => x.semester === '2학기')] };
}
export function gradeMissions(grade: SchoolGrade, unit: NewCurriculumUnitId): CurriculumMission[] | null {
  if (grade === 3) return null;
  const topics = PLANS[grade][unit].topics;
  return Array.from({length:10}, (_, i) => ({
    name: i === 9 ? `${topics[4]} 수호자` : `${topics[i % topics.length]} ${i < 5 ? '첫걸음' : '도전'}`,
    kind: i === 0 ? 'concept' : i === 9 ? 'guardian' : i % 3 === 0 ? 'story' : 'practice',
    skill: topics[i % topics.length],
    description: `${grade}학년 ${topics[i % topics.length]} 문제를 그림과 이야기로 풀어요.`,
  }));
}

const ri=(min:number,max:number,r:()=>number)=>Math.floor(r()*(max-min+1))+min;
const gcd=(a:number,b:number):number=>b===0?Math.abs(a):gcd(b,a%b);
const shuffled=<T>(items:T[],r:()=>number)=>[...items].sort(()=>r()-.5);
const choice=(unit:NewCurriculumUnitId,skill:string,prompt:string,answer:string,wrongs:string[],visual:CurriculumVisual,explanation:string,r:()=>number):CurriculumQuestion=>({unit,skill,prompt,kind:'choice',answer,choices:shuffled([answer,...wrongs.filter(x=>x!==answer)].slice(0,4),r).map(label=>({label,value:label})),visual,hints:[`그림과 ${skill}의 뜻을 먼저 살펴봐요.`,`보기의 값을 하나씩 비교해요.`,explanation],explanation});
const number=(unit:NewCurriculumUnitId,skill:string,prompt:string,answer:number,visual:CurriculumVisual,explanation:string):CurriculumQuestion=>({unit,skill,prompt,kind:'number',answer:String(answer),visual,hints:[`${skill}에서 무엇을 구하는지 찾아봐요.`,'식을 한 단계씩 써 보세요.',explanation],explanation});
const bars=(n:number,d:number):CurriculumVisual=>({kind:'fraction',numerator:n,denominator:d});
const graph=(values:number[]):CurriculumVisual=>({kind:'pictograph',icon:'●',value:1,rows:values.map((v,i)=>({label:['가','나','다','라'][i],icons:v}))});

export function generateGradeQuestion(grade: Exclude<SchoolGrade,3>, unit: NewCurriculumUnitId, mission: number, r:()=>number=Math.random): CurriculumQuestion {
  const skill=PLANS[grade][unit].topics[mission%5];
  if(unit==='plane'){
    const mode=mission%5;
    if(grade===1){
      const max=mode===0?9:mode===4?50:100,a=ri(1,max,r),b=Math.max(0,a-ri(1,Math.max(1,Math.floor(a/2)),r));
      if(mode===0)return choice(unit,skill,`열매가 ${a}개 있어요. 알맞은 수는?`,String(a),[String(Math.max(0,a-1)),String(a+1),String(a+2)],graph([a]),`${a}개를 하나씩 세면 ${a}예요.`,r);
      if(mode===1)return choice(unit,skill,`${a}, ${a+1}, □, ${a+3}에서 □에 알맞은 수는?`,String(a+2),[String(a+1),String(a+3),String(a+4)],graph([1,2,3,4]),`1씩 커지므로 ${a+2}예요.`,r);
      if(mode===3){const tens=ri(1,8,r),ones=ri(0,9,r),answer=tens*10+ones;return choice(unit,skill,`10개 묶음 ${tens}개와 낱개 ${ones}개는 얼마일까요?`,String(answer),[String(tens+ones),String(tens*10),String(answer+10)],graph([tens,ones]),`${tens}십 ${ones}은 ${answer}이에요.`,r)}
      return choice(unit,skill,`${a}와 ${b} 중 더 큰 수를 골라요.`,String(Math.max(a,b)),[String(Math.min(a,b)),String(a+1),String(Math.max(0,b-1))],graph([2,4,3]),`수를 차례대로 놓으면 ${Math.max(a,b)}이 더 커요.`,r);
    }
    if(grade===2){
      const a=ri(mode<2?100:1000,mode<2?999:9999,r),digit=mode<2?1000:10000;
      if(mode===0)return choice(unit,skill,`${a}에서 백의 자리 숫자는?`,String(Math.floor(a/100)%10),[String(Math.floor(a/10)%10),String(a%10),String(Math.floor(a/1000)%10)],graph([2,3,4]),`백의 자리를 찾으면 ${Math.floor(a/100)%10}이에요.`,r);
      if(mode===1)return choice(unit,skill,`${a}에서 ${Math.floor(a/100)%10}이 나타내는 값은?`,String(Math.floor(a/100)%10*100),[String(Math.floor(a/100)%10),String(Math.floor(a/100)%10*10),String(a)],graph([2,3,4]),`백의 자리이므로 ${Math.floor(a/100)%10*100}을 나타내요.`,r);
      if(mode===2)return choice(unit,skill,'999보다 1만큼 큰 수는?','1000',['990','9990','1001'],graph([9,9,9]),'999에 1을 더하면 새로운 천 묶음이 생겨 1000이에요.',r);
      const b=Math.max(1,a-ri(1,Math.floor(digit/5),r));return choice(unit,skill,`${a}와 ${b} 중 더 큰 수는?`,String(a),[String(b),String(a-1),String(b+1)],graph([2,4,3]),`높은 자리부터 비교하면 ${a}이 더 커요.`,r);
    }
    if(grade===4){const a=ri(10000,99999999,r),b=a-ri(1,9999,r);if(mode===0)return choice(unit,skill,'9,999보다 1 큰 수는?','10000',['9990','9999','10001'],graph([9,9,9,9]),'새로운 만 묶음이 생겨 10,000이에요.',r);if(mode===1)return choice(unit,skill,'100,000,000을 읽은 것은?','일억',['일만','일조','십억'],graph([1,0,0,0]),'0이 여덟 개인 수 100,000,000은 일억이에요.',r);if(mode===2)return choice(unit,skill,'1,000,000,000,000을 읽은 것은?','일조',['일억','십조','백억'],graph([1,0,0,0]),'1 뒤에 0이 열두 개인 수는 일조예요.',r);if(mode===3)return choice(unit,skill,`${a.toLocaleString()}에서 만의 자리 숫자는?`,String(Math.floor(a/10000)%10),[String(Math.floor(a/1000)%10),String(Math.floor(a/100000)%10),String(a%10)],graph([2,4,3]),'오른쪽부터 일·십·백·천·만의 자리를 찾아요.',r);return choice(unit,skill,`${a.toLocaleString()}와 ${b.toLocaleString()} 중 더 큰 수는?`,String(a),[String(b),String(a-1),String(b+1)],graph([2,4,3]),`높은 자리부터 비교하면 ${a.toLocaleString()}이 더 커요.`,r)}
    if(grade===5){
      const n=ri(12,48,r),m=ri(2,9,r),factors=Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0);
      if(mode===1)return choice(unit,skill,`${m}의 배수인 것은?`,String(m*ri(2,6,r)),[String(m+1),String(m*2+1),String(Math.max(1,m-1))],graph([m,2,3]),`${m}에 자연수를 곱해 만든 수가 배수예요.`,r);
      if(mode>=2){const a=ri(2,8,r),b=ri(2,8,r),g=gcd(a,b),l=a*b/g;return choice(unit,skill,mode===4?`${a}와 ${b}의 최소공배수는?`:`${a}와 ${b}의 최대공약수는?`,String(mode===4?l:g),[String(a*b),String(a+b),String(Math.max(a,b))],graph([a,b]),mode===4?`두 수의 공배수 중 가장 작은 수는 ${l}이에요.`:`두 수를 모두 나누는 가장 큰 수는 ${g}이에요.`,r)}
      return choice(unit,skill,`${n}의 약수인 것은?`,String(factors[ri(0,factors.length-1,r)]),[String(n-1),String(n+1),String(n+2)],graph([2,3,4]),`${n}을 나누어떨어지게 하는 수가 약수예요.`,r);
    }
    const d=ri(2,8,r),n=ri(1,d-1,r),q=ri(2,6,r);
    if(mode===1)return choice(unit,skill,`${q} ÷ ${n}/${d}의 값은?`,`${q*d}/${n}`,[`${q*n}/${d}`,`${q}/${n*d}`,`${d}/${q*n}`],bars(n,d),`자연수에 나누는 분수의 역수를 곱해 ${q*d}/${n}이에요.`,r);
    if(mode>=2){const n2=ri(1,5,r),d2=ri(n2+1,8,r);return choice(unit,skill,`${n}/${d} ÷ ${n2}/${d2}의 값은?`,`${n*d2}/${d*n2}`,[`${n*n2}/${d*d2}`,`${n*d2}/${d+n2}`,`${d*n2}/${n*d2}`],bars(n,d),`나누는 분수의 분자와 분모를 바꾸어 곱하면 ${n*d2}/${d*n2}예요.`,r)}
    return choice(unit,skill,`${n}/${d} ÷ ${q}의 값은?`,`${n}/${d*q}`,[`${n*q}/${d}`,`${n}/${d+q}`,`${q}/${n*d}`],bars(n,d*q),`분모에 ${q}를 곱해 ${n}/${d*q}가 돼요.`,r);
  }
  if(unit==='lengthTime'){
    const mode=mission%5;
    if(grade===1){
      if(mode>=3){const start=ri(1,5,r),step=mode===3?2:3,answer=start+step*3;return choice(unit,skill,`${start}, ${start+step}, ${start+step*2}, □에서 □는?`,String(answer),[String(answer-1),String(answer+1),String(answer+step)],graph([1,2,3,4]),`${step}씩 커지는 규칙이므로 ${answer}이에요.`,r)}
      const h=ri(1,11,r),half=mode===1;return choice(unit,skill,`시계의 짧은바늘이 ${h}${half?`과 ${h+1} 사이`:'을'}, 긴바늘이 ${half?'6':'12'}를 가리켜요. 알맞은 시각은?`,`${h}시${half?' 30분':''}`,[`${h+1}시`,`${h}시 ${half?'정각':'30분'}`,`${Math.max(1,h-1)}시`],{kind:'length-time',measure:'time',values:[h,half?30:0],unit:'분'},`긴바늘이 ${half?'6이면 30분,':'12이면 정각이고,'} 짧은바늘을 함께 읽어요.`,r)
    }
    if(grade===2){
      const h=ri(1,10,r),m=[0,10,20,30,40,50][ri(0,5,r)];
      if(mode===1||mode===2){const elapsed=ri(1,5,r)*10,answerM=(m+elapsed)%60,answerH=h+Math.floor((m+elapsed)/60);return choice(unit,skill,`${h}시 ${m}분에서 ${elapsed}분 뒤는?`,`${answerH}시 ${answerM}분`,[`${h}시 ${answerM}분`,`${answerH+1}시 ${answerM}분`,`${h}시 ${elapsed}분`],{kind:'length-time',measure:'time',values:[h,m],unit:'분'},`분을 더하고 60분이 되면 1시간으로 바꾸어요.`,r)}
      if(mode>=3){const days=['월','화','수','목','금','토','일'],idx=ri(0,5,r);return choice(unit,skill,`${days[idx]}요일의 다음 날은?`,`${days[idx+1]}요일`,[`${days[Math.max(0,idx-1)]}요일`,`${days[Math.min(6,idx+2)]}요일`,'알 수 없어요'],graph([1,2,3,4]),`요일은 월·화·수·목·금·토·일 순서예요.`,r)}
      return choice(unit,skill,`시계가 ${h}시 ${String(m).padStart(2,'0')}분을 가리켜요. 알맞은 시각은?`,`${h}시 ${m}분`,[`${h+1}시 ${m}분`,`${h}시 ${m===0?30:0}분`,`${m}시 ${h}분`],{kind:'length-time',measure:'time',values:[h,m],unit:'분'},`짧은바늘은 ${h}, 긴바늘은 ${m}분을 나타내요.`,r)
    }
    if(grade===4){const a=ri(20,150,r),b=ri(10,40,r);if(mode===2)return choice(unit,skill,`${a}°인 각은 어느 종류일까요?`,a<90?'예각':a===90?'직각':'둔각',['예각','직각','둔각'].filter(x=>x!==(a<90?'예각':a===90?'직각':'둔각')),{kind:'geometry',shape:'angle',label:`${a}°`},'90°보다 작으면 예각, 같으면 직각, 크면 둔각이에요.',r);if(mode===3){const angles=[60,60,60];return choice(unit,skill,'세 각의 크기가 모두 60°인 삼각형은?','정삼각형',['직각삼각형','둔각삼각형','이등변삼각형이 아님'],{kind:'geometry',shape:'right-triangle',label:angles.join('°, ')+'°'},'세 각과 세 변이 같은 삼각형은 정삼각형이에요.',r)}return number(unit,skill,`${a}°인 각과 ${b}°인 각을 이어 붙이면 몇 도일까요?`,a+b,{kind:'geometry',shape:'angle',label:`${a}° + ${b}°`},`${a} + ${b} = ${a+b}°예요.`)}
    if(grade===5){
      if(mode>=3){const x=ri(2,8,r),answer=3*x+2;return choice(unit,skill,`입력 수에 3을 곱하고 2를 더해요. 입력이 ${x}이면 출력은?`,String(answer),[String(x+5),String(3*(x+2)),String(answer-1)],graph([x,answer]),`대응식 3 × ${x} + 2 = ${answer}이에요.`,r)}
      const a=ri(2,9,r),b=ri(2,9,r),c=ri(1,9,r),answer=mode===1?(a+b)*c:a+b*c;return number(unit,skill,mode===1?`(${a} + ${b}) × ${c}는?`:`${a} + ${b} × ${c}는?`,answer,graph([a,b,c]),mode===1?`괄호부터 계산해 ${answer}이에요.`:`곱셈부터 계산해 ${answer}이에요.`)
    }
    const divisor=ri(2,9,r),quotient=ri(12,48,r)/10,dividend=Number((divisor*quotient).toFixed(2));if(mode===1)return choice(unit,skill,`${Math.round(dividend)} ÷ ${divisor/10}의 몫으로 알맞은 것은?`,String(Math.round(dividend)/(divisor/10)),[String(Math.round(dividend)/divisor),String(Math.round(dividend)*divisor),String(quotient)],{kind:'decimal',tenths:divisor},'나누는 수를 자연수로 바꾸도록 두 수에 똑같이 10을 곱해요.',r);if(mode===2)return choice(unit,skill,`${dividend} ÷ ${divisor/10}의 몫은?`,String(Number((dividend/(divisor/10)).toFixed(2))),[String(Number((dividend/divisor).toFixed(2))),String(Number((dividend*divisor).toFixed(2))),String(divisor)],{kind:'decimal',tenths:divisor},'나누는 수의 소수점을 옮긴 만큼 나누어지는 수도 옮겨 계산해요.',r);if(mode>=3){const whole=ri(20,60,r),d=ri(3,8,r),q=Math.floor(whole/d),rem=whole-d*q;return choice(unit,skill,`${whole} ÷ ${d}의 몫을 자연수까지만 구하면 나머지는?`,String(rem),[String(q),String(d),String(whole-q)],graph([whole,d]),`${whole} = ${d} × ${q} + ${rem}이므로 나머지는 ${rem}이에요.`,r)}return choice(unit,skill,`${dividend} ÷ ${divisor}의 몫은?`,String(quotient),[String(quotient*10),String(quotient/10),String(quotient+1)],{kind:'decimal',tenths:Math.min(9,Math.round(quotient))},`${dividend} ÷ ${divisor} = ${quotient}예요.`,r)
  }
  if(unit==='fractionDecimal'){
    if(grade===1){const mode=mission%5,total=ri(5,10,r),left=ri(1,total-1,r),right=total-left;if(mode===0)return choice(unit,skill,`${left}와 ${right}을 모으면 얼마일까요?`,String(total),[String(left),String(right),String(total+1)],graph([left,right]),`${left}와 ${right}을 모으면 ${total}이에요.`,r);if(mode===2)return choice(unit,skill,`${left}에 얼마를 더하면 10이 될까요?`,String(10-left),[String(left),String(9-left),String(11-left)],graph([left,10-left]),`${left} + ${10-left} = 10이에요.`,r);if(mode===3)return choice(unit,skill,`${left} + □ = ${total}에서 □는?`,String(right),[String(left),String(total),String(right+1)],graph([left,right]),`${left}에 ${right}을 더하면 ${total}이에요.`,r);if(mode===4)return choice(unit,skill,`새 ${left}마리와 나비 ${right}마리를 함께 세면?`,String(total),[String(left),String(right),String(total-1)],graph([left,right]),`${left} + ${right} = ${total}마리예요.`,r);return choice(unit,skill,`${total}을 ${left}와 어떤 수로 가르면 될까요?`,String(right),[String(left),String(right+1),String(Math.max(0,right-1))],graph([left,right]),`${left} + ${right} = ${total}이므로 빈칸은 ${right}이에요.`,r)}
    if(grade===2){const mode=mission%5,m=ri(1,4,r),cm=ri(1,9,r)*10;if(mode===0)return choice(unit,skill,`자로 잰 연필의 길이가 눈금 ${cm}에 닿았어요. 몇 cm일까요?`,String(cm),[String(cm-10),String(cm+10),String(m)],{kind:'length-time',measure:'length',values:[cm],unit:'cm'},`0에서 시작해 닿은 눈금 ${cm}을 읽어요.`,r);if(mode===1||mode===2)return choice(unit,skill,`${m} m ${cm} cm를 cm로 나타내면?`,String(m*100+cm),[String(m*10+cm),String(m*100+cm+10),String(cm)],{kind:'length-time',measure:'length',values:[m,cm],unit:'cm'},`1 m는 100 cm이므로 ${m*100} + ${cm} = ${m*100+cm} cm예요.`,r);if(mode===3){const total=cm+80,answerM=m+Math.floor(total/100),answerCm=total%100;return choice(unit,skill,`${m} m ${cm} cm와 80 cm를 이어 붙인 길이는?`,`${answerM} m ${answerCm} cm`,[`${m} m ${cm} cm`,`${m+1} m ${cm} cm`,`${m} m 80 cm`],{kind:'length-time',measure:'length',values:[m,cm,80],unit:'cm'},`cm끼리 더하고 100 cm는 1 m로 바꾸면 ${answerM} m ${answerCm} cm예요.`,r)}return choice(unit,skill,`${m+1} m에서 ${cm} cm를 빼면?`,`${m} m ${100-cm} cm`,[`${m} m ${cm} cm`,`${m+1} m ${100-cm} cm`,`${m} m ${100+cm} cm`],{kind:'length-time',measure:'length',values:[m+1,cm],unit:'cm'},`1 m를 100 cm로 바꾸어 빼면 ${m} m ${100-cm} cm예요.`,r)}
    if(grade===4){const mode=mission%5,a=ri(2,9,r),b=ri(2,8,r),c=ri(1,7,r);if(mode===1)return choice(unit,skill,`${a}+${b}=${c}+□가 참이 되도록 □에 알맞은 수는?`,String(a+b-c),[String(a+b+c),String(a+b),String(Math.abs(a-b))],graph([a,b,c]),`양쪽 값이 같아야 하므로 □는 ${a+b-c}예요.`,r);if(mode>=2){const answer=a*c+b;return choice(unit,skill,`입력 수에 ${c}를 곱하고 ${b}를 더해요. 입력이 ${a}이면 출력은?`,String(answer),[String((a+b)*c),String(a+b+c),String(answer-1)],graph([a,answer]),`${a} × ${c} + ${b} = ${answer}이에요.`,r)}const answer=(a+b)*c;return number(unit,skill,`(${a} + ${b}) × ${c}를 계산하면?`,answer,graph([a,b,c]),`괄호 안부터 계산해 ${answer}예요.`)}
    if(grade===5){const mode=mission%5,a=ri(2,9,r),b=ri(2,9,r);const left=mode<2?a/10:a/10,right=mode===0?b:mode===1?b/10:mode===2?b:mode===3?b/100:b/10,answer=Number((left*right).toFixed(3));return choice(unit,skill,`${left} × ${right}는 얼마일까요?`,String(answer),[String(answer*10),String(answer/10),String(Number((left+right).toFixed(2)))],graph([a,b]),`자연수처럼 곱한 뒤 소수 자릿수를 맞추면 ${answer}이에요.`,r)}
    const mode=mission%5,part=ri(10,80,r),whole=ri(20,100,r),piece=Math.max(1,Math.round(whole*part/100));
    if(mode===0)return choice(unit,skill,`${piece}:${whole}처럼 두 양을 비교한 표현은?`,'비',['합','차','곱'],graph([piece,whole]),'두 양을 나눗셈으로 비교한 관계를 비라고 해요.',r);
    if(mode===1)return choice(unit,skill,`${piece}:${whole}의 비율을 분수로 나타내면?`,`${piece}/${whole}`,[`${whole}/${piece}`,`${piece+whole}/${whole}`,`${piece}/${piece+whole}`],bars(Math.min(piece,whole),whole),`비교하는 양÷기준량이므로 ${piece}/${whole}이에요.`,r);
    if(mode===2)return choice(unit,skill,`${part}%를 분수로 나타내면?`,`${part}/100`,[`${100}/${part}`,`${part}/10`,`1/${part}`],bars(part,100),`${part}%는 전체 100 중 ${part}이므로 ${part}/100이에요.`,r);
    return choice(unit,skill,`전체의 ${part}%를 소수로 나타내면?`,String(part/100),[String(part/10),String(part),String((100-part)/100)],{kind:'decimal',tenths:Math.min(9,Math.round(part/10))},`${part}% = ${part}/100 = ${part/100}예요.`,r)
  }
  if(unit==='circle'){
    const mode=mission%5;
    if(grade===1){const solids=['상자 모양','공 모양','둥근기둥 모양'];const answer=solids[mode%3];const clue=answer==='상자 모양'?'평평한 면으로 쌓기 좋아요':answer==='공 모양'?'어느 쪽으로도 잘 굴러가요':'세우기도 하고 한쪽으로 굴리기도 해요';return choice(unit,skill,`“${clue}”에 알맞은 모양은?`,answer,solids.filter(x=>x!==answer),{kind:'geometry',shape:'rectangle'},`${clue}라는 특징을 가진 것은 ${answer}이에요.`,r)}
    if(grade===2){const shapes=['삼각형','사각형','원'];const answer=shapes[mode%3];return choice(unit,skill,`${answer}의 특징으로 알맞은 것은?`,answer==='원'?'뾰족한 꼭짓점이 없어요':answer==='삼각형'?'곧은 변이 3개예요':'곧은 변이 4개예요',['곧은 변이 2개예요','꼭짓점이 5개예요','모든 선이 둥글어요'],{kind:'geometry',shape:answer==='삼각형'?'right-triangle':answer==='사각형'?'rectangle':'angle'},`${answer}의 변과 꼭짓점을 세어 보면 알 수 있어요.`,r)}
    if(grade===4){if(mode===1)return choice(unit,skill,'아무리 길게 늘여도 만나지 않는 두 직선의 관계는?','평행',['수직','합동','대칭'],{kind:'geometry',shape:'rectangle'},'같은 간격을 유지하며 만나지 않는 두 직선은 평행이에요.',r);if(mode>=2){const sides=mode===2?4:mode===3?6:5;return choice(unit,skill,`변이 ${sides}개인 다각형은?`,sides===4?'사각형':sides===5?'오각형':'육각형',['삼각형','오각형','육각형'].filter(x=>x!==(sides===4?'사각형':sides===5?'오각형':'육각형')),{kind:'geometry',shape:'rectangle'},`변의 수가 ${sides}개인 다각형이에요.`,r)}return choice(unit,skill,'두 직선이 직각으로 만날 때 관계는?','수직',['평행','합동','대칭'],{kind:'geometry',shape:'angle',label:'90°'},'직각으로 만나는 두 직선은 수직이에요.',r)}
    if(grade===5){if(mode===3)return choice(unit,skill,'한 직선을 접는 선으로 하여 완전히 겹치는 도형은?','선대칭도형',['점대칭도형','합동이 아닌 도형','평행도형'],{kind:'geometry',shape:'rectangle'},'대칭축을 따라 접었을 때 겹치는 도형은 선대칭도형이에요.',r);if(mode===4)return choice(unit,skill,'한 점을 중심으로 180° 돌렸을 때 겹치는 도형은?','점대칭도형',['선대칭도형','직각도형','평행도형'],{kind:'geometry',shape:'rectangle'},'대칭의 중심 둘레로 반 바퀴 돌려 겹치면 점대칭도형이에요.',r);return choice(unit,skill,'서로 포개었을 때 완전히 겹치는 두 도형은?','합동',['대칭','수직','평행'],{kind:'geometry',shape:'rectangle'},'모양과 크기가 같아 완전히 겹치는 도형은 합동이에요.',r)}
    const radius=ri(2,9,r),answer=(radius*radius*3.14).toFixed(2);if(mode===0)return choice(unit,skill,`지름이 ${radius*2} cm인 원의 원주는 원주율 3.14일 때?`,(radius*2*3.14).toFixed(2),[(radius*3.14).toFixed(2),answer,String(radius*2)],{kind:'circle',focus:'given-radius',radius,unit:'cm'},`지름 × 원주율 = ${radius*2} × 3.14예요.`,r);if(mode===1)return choice(unit,skill,'원의 지름에 대한 원주의 비율을 무엇이라 하나요?','원주율',['반지름','넓이','중심각'],{kind:'circle',focus:'given-radius',radius,unit:'cm'},'원주를 지름으로 나눈 일정한 값을 원주율이라고 해요.',r);if(mode===2)return choice(unit,skill,`반지름 ${radius} cm인 원의 지름은?`,String(radius*2),[String(radius),String(radius+2),String(radius*radius)],{kind:'circle',focus:'given-radius',radius,unit:'cm'},`지름은 반지름의 2배인 ${radius*2} cm예요.`,r);return choice(unit,skill,`반지름이 ${radius} cm인 원의 넓이를 원주율 3.14로 구하면 몇 cm²일까요?`,answer,[(radius*2*3.14).toFixed(2),(radius*radius).toFixed(2),(radius*3.14).toFixed(2)],{kind:'circle',focus:'given-radius',radius,unit:'cm'},`${radius} × ${radius} × 3.14 = ${answer} cm²예요.`,r)
  }
  if(unit==='fraction'){
    const d=grade<=2?ri(2,6,r):ri(3,9,r),n=ri(1,d-1,r);
    if(grade===1){const mode=mission%5,order=ri(2,5,r),items=['별','나무','집','연못','꽃'];if(mode===0)return choice(unit,skill,'상자 모양 두 개를 위아래로 쌓았어요. 위에 있는 모양은?','둘째 모양',['첫째 모양','왼쪽 모양','알 수 없어요'],graph([1,2]),'아래 모양 위에 놓인 둘째 모양이 위에 있어요.',r);if(mode===1)return choice(unit,skill,'나무 아래에 꽃이 있어요. 꽃의 위치는?','나무의 아래',['나무의 위','나무의 앞','나무의 오른쪽'],graph([1,2]),'문장에서 꽃이 나무 아래에 있다고 했어요.',r);if(mode===2)return choice(unit,skill,'집 앞에 나무가 있어요. 집에서 본 나무의 위치는?','앞',['뒤','왼쪽','위'],graph([1,2]),'집 앞에 있으므로 위치는 앞이에요.',r);if(mode===3)return choice(unit,skill,'별의 오른쪽에 달이 있어요. 달의 위치는?','오른쪽',['왼쪽','아래','뒤'],graph([1,2]),'별을 기준으로 달은 오른쪽에 있어요.',r);return choice(unit,skill,`왼쪽부터 별, 나무, 집, 연못, 꽃이 있어요. ${order}번째에 있는 것은?`,items[order-1],items.filter((_,i)=>i!==order-1),graph([1,2,3,4]),`왼쪽부터 차례로 세면 ${order}번째는 ${items[order-1]}이에요.`,r)}
    if(grade===2){const mode=mission%5,start=ri(1,5,r),step=ri(2,5,r),answer=start+step*3;if(mode===1)return choice(unit,skill,'○ △ ○ △ ○ □에서 □에 올 모양은?','△',['○','□','☆'],graph([1,2,1,2]),'○와 △가 번갈아 나오는 규칙이에요.',r);if(mode===2)return choice(unit,skill,'1층 2개, 2층 4개, 3층 6개로 쌓아요. 4층은?','8개',['6개','7개','10개'],graph([2,4,6]),'층이 하나 늘 때마다 2개씩 늘어나요.',r);if(mode===3)return choice(unit,skill,`${answer}, ${answer-step}, ${answer-step*2}, □에서 □는?`,String(start),[String(start-1),String(start+1),String(start+step)],graph([4,3,2,1]),`${step}씩 줄어드는 규칙이므로 ${start}예요.`,r);if(mode===4)return choice(unit,skill,`수 배열이 ${step}씩 커져요. 규칙을 말한 것은?`,`${step}씩 더한다`,[`${step}씩 뺀다`,'두 배씩 커진다','같은 수가 반복된다'],graph([start,start+step,start+step*2]),'이웃한 두 수의 차를 살펴보면 알 수 있어요.',r);return choice(unit,skill,`${start}, ${start+step}, ${start+step*2}, □의 규칙에서 □는?`,String(answer),[String(answer-1),String(answer+1),String(answer+step)],graph([1,2,3,4]),`${step}씩 커지는 규칙이므로 ${answer}예요.`,r)}
    if(grade===4){
      const mode=mission%5,b=ri(1,d-1,r);
      if(mode===0)return choice(unit,skill,`${d+ n}/${d}는 어떤 분수인가요?`,'가분수',['진분수','자연수','소수'],bars(d+n,d),'분자가 분모보다 크므로 가분수예요.',r);
      if(mode===1)return choice(unit,skill,`${d+n}/${d}를 대분수로 나타내면?`,`1 ${n}/${d}`,[`${n} 1/${d}`,`1 ${d}/${n}`,`${d} ${n}/1`],bars(d+n,d),`${d}/${d}가 1이고 ${n}/${d}가 남아요.`,r);
      if(mode===2)return choice(unit,skill,`${n}/${d}와 ${b}/${d} 중 더 큰 분수는?`,`${Math.max(n,b)}/${d}`,[`${Math.min(n,b)}/${d}`,`${n+b}/${d}`,`${Math.max(n,b)}/${d+1}`],bars(Math.max(n,b),d),'분모가 같으면 분자가 큰 분수가 더 커요.',r);
      if(mode===3)return choice(unit,skill,`${n}/${d} + ${b}/${d}는 얼마일까요?`,`${n+b}/${d}`,[`${n+b}/${d*2}`,`${Math.abs(n-b)}/${d}`,`${n*b}/${d}`],bars(n+b,d),`분모는 그대로 두고 분자끼리 더해 ${n+b}/${d}예요.`,r);
      const big=Math.max(n,b),small=Math.min(n,b);return choice(unit,skill,`${big}/${d} - ${small}/${d}는 얼마일까요?`,`${big-small}/${d}`,[`${big+small}/${d}`,`${big-small}/${d*2}`,`${big}/${d-small}`],bars(big-small,d),`분모는 그대로 두고 분자끼리 빼면 ${big-small}/${d}예요.`,r)
    }
    if(grade===5){
      const mode=mission%5,d2=ri(2,8,r);
      if(mode===0){const k=ri(2,5,r),sn=ri(1,4,r),sd=ri(sn+1,7,r);return choice(unit,skill,`${sn*k}/${sd*k}을 약분하면?`,`${sn}/${sd}`,[`${sn*k}/${sd}`,`${sn}/${sd*k}`,`${sn+1}/${sd}`],bars(sn*k,sd*k),`분자와 분모를 ${k}로 나누면 ${sn}/${sd}예요.`,r)}
      if(mode===1){const common=d*d2;return choice(unit,skill,`${n}/${d}와 1/${d2}를 분모 ${common}으로 통분하면 첫째 분수는?`,`${n*d2}/${common}`,[`${n*d}/${common}`,`${n+d2}/${common}`,`${n}/${common}`],bars(n*d2,common),`분자와 분모에 ${d2}를 곱하면 ${n*d2}/${common}이에요.`,r)}
      if(mode===4)return choice(unit,skill,`${n}/${d} × 2/${d2}는?`,`${n*2}/${d*d2}`,[`${n+2}/${d+d2}`,`${n*2}/${d+d2}`,`${n+2}/${d*d2}`],bars(Math.min(n*2,d*d2),d*d2),`분자는 분자끼리, 분모는 분모끼리 곱해 ${n*2}/${d*d2}예요.`,r);
      const leftN=n*d2,rightN=d,answerN=mode===2?leftN+rightN:Math.abs(leftN-rightN),answerD=d*d2;return choice(unit,skill,`${n}/${d} ${mode===2?'+':'-'} 1/${d2}의 계산 결과는?`,`${answerN}/${answerD}`,[`${n+1}/${d+d2}`,`${leftN+rightN}/${answerD}`,`${answerN+1}/${answerD}`],bars(Math.min(answerN,answerD),answerD),`공통분모 ${answerD}로 통분해 계산하면 ${answerN}/${answerD}예요.`,r)
    }
    const mode=mission%5,a=ri(1,5,r),b=ri(2,6,r);
    if(mode===0)return choice(unit,skill,`비 ${a}:${b}와 같은 비는?`,`${a*2}:${b*2}`,[`${a+2}:${b+2}`,`${b}:${a}`,`${a}:${b+2}`],graph([a,b]),`두 항에 같은 수 2를 곱하면 ${a*2}:${b*2}예요.`,r);
    if(mode===1||mode===2){const x=ri(2,7,r);return choice(unit,skill,`${a}:${b} = ${a*x}:□에서 □는?`,String(b*x),[String(b+x),String(a*x),String(a*b*x)],graph([a,b,a*x]),`앞항에 ${x}를 곱했으므로 뒤 항에도 ${x}를 곱해 ${b*x}예요.`,r)}
    if(mode===3){const total=(a+b)*ri(2,6,r),first=total*a/(a+b);return choice(unit,skill,`${total}개를 ${a}:${b}로 비례배분할 때 첫째 몫은?`,String(first),[String(total-first),String(total/a),String(a+b)],graph([a,b]),`전체를 ${a+b}묶음으로 나눈 뒤 ${a}묶음을 가지면 ${first}개예요.`,r)}
    const price=ri(2,6,r)*1000,count=ri(2,5,r);return number(unit,skill,`${count}개에 ${price}원인 열매를 같은 비율로 ${count*2}개 사면 몇 원일까요?`,price*2,graph([count,count*2]),`개수가 2배이므로 값도 2배인 ${price*2}원이에요.`)
  }
  if(unit==='measurement'){
    const mode=mission%5;
    if(grade===1){const a=ri(2,9,r),b=a===2?3:a-1,words=[['더 긴','길이'],['더 무거운','무게'],['더 넓은','넓이'],['더 많이 담는','들이'],['앞에서 첫째','순서']][mode];if(mode===4)return choice(unit,skill,'별, 나무, 집을 왼쪽부터 놓았어요. 첫째는?','별',['나무','집','알 수 없어요'],graph([1,2,3]),'왼쪽에서 처음 있는 별이 첫째예요.',r);return choice(unit,skill,`A는 ${a}칸, B는 ${b}칸이에요. ${words[0]} 것은?`,'A',['B','둘이 같아요','알 수 없어요'],graph([a,b]),`${a}칸이 ${b}칸보다 크므로 A의 ${words[1]}가 더 커요.`,r)}
    if(grade===2){const red=ri(2,6,r),blue=ri(2,6,r);if(mode===0)return choice(unit,skill,'빨간 단추와 파란 단추를 나눌 때 알맞은 분류 기준은?','색깔',['크기','날짜','무게를 재지 않고 무게'],graph([red,blue]),'빨강과 파랑은 색깔에 따른 분류예요.',r);if(mode===2)return choice(unit,skill,'빨간 큰 단추를 찾으려면 어떤 두 기준이 필요한가요?','색깔과 크기',['색깔과 날짜','개수와 시간','길이와 들이'],graph([red,blue]),'빨간색인지와 큰지 두 기준을 함께 살펴요.',r);return choice(unit,skill,`빨간 단추 ${red}개와 파란 단추 ${blue}개를 분류했어요. ${mode===3?'모두':'더 많은 색의 개수는'} 몇 개일까요?`,String(mode===3?red+blue:Math.max(red,blue)),[String(Math.abs(red-blue)),String(Math.min(red,blue)),String(red+blue)],graph([red,blue]),mode===3?`두 모둠을 합하면 ${red+blue}개예요.`:`두 개수를 비교하면 ${Math.max(red,blue)}개가 더 많아요.`,r)}
    if(grade===4){
      const a=ri(11,89,r)/10,b=ri(11,89,r)/10;
      if(mode===0)return choice(unit,skill,`${a}에서 소수 첫째 자리 숫자는?`,String(Math.round(a*10)%10),[String(Math.floor(a)),String(Math.round(a*100)%10),String(Math.round(a*10))],{kind:'decimal',tenths:Math.round(a*10)%10},'소수점 바로 오른쪽이 소수 첫째 자리예요.',r);
      if(mode===1||mode===2){const big=Math.max(a,b),small=Math.min(a,b),answer=Number((mode===1?big+small:big-small).toFixed(1));return choice(unit,skill,`${big} ${mode===1?'+':'-'} ${small}는?`,String(answer),[String(Number((answer+.1).toFixed(1))),String(Number((answer-.1).toFixed(1))),String(Number((big+small).toFixed(1)))],{kind:'decimal',tenths:Math.round(answer*10)%10},`소수점을 맞추어 계산하면 ${answer}예요.`,r)}
      const base=ri(120,980,r),place=mode===3?10:100,answer=Math.round(base/place)*place;return choice(unit,skill,`${base}을 ${place===10?'십':'백'}의 자리까지 나타내도록 반올림하면?`,String(answer),[String(Math.floor(base/place)*place),String(Math.ceil(base/place)*place),String(base)],graph([2,3,4]),`바로 아래 자리의 숫자를 보고 반올림하면 ${answer}이에요.`,r)
    }
    if(grade===5){
      if(mode===0){const base=ri(121,989,r),answer=Math.round(base/10)*10;return choice(unit,skill,`${base}을 십의 자리까지 반올림하면?`,String(answer),[String(Math.floor(base/10)*10),String(Math.ceil(base/100)*100),String(base)],graph([2,3,4]),`일의 자리를 보고 반올림하면 ${answer}이에요.`,r)}
      const w=ri(3,12,r),h=ri(2,9,r);
      if(mode===1)return number(unit,skill,`가로 ${w} cm, 세로 ${h} cm인 직사각형의 둘레는 몇 cm일까요?`,2*(w+h),{kind:'geometry',shape:'rectangle',label:`${w} cm × ${h} cm`},`(${w} + ${h}) × 2 = ${2*(w+h)} cm예요.`);
      if(mode===2)return number(unit,skill,`밑변 ${w} cm, 높이 ${h} cm인 평행사변형의 넓이는 몇 cm²일까요?`,w*h,{kind:'geometry',shape:'rectangle',label:`${w} cm × ${h} cm`},`${w} × ${h} = ${w*h} cm²예요.`);
      if(mode===3)return choice(unit,skill,'직육면체의 면, 모서리, 꼭짓점의 수로 알맞은 것은?','6, 12, 8',['6, 8, 12','8, 12, 6','12, 6, 8'],{kind:'geometry',shape:'rectangle'},'직육면체는 면 6개, 모서리 12개, 꼭짓점 8개예요.',r);
      return choice(unit,skill,'직육면체의 전개도는 어떤 그림인가요?','모든 면을 잘라 한 평면에 펼친 그림',['마주 보는 면만 그린 그림','꼭짓점만 이은 그림','한 면만 크게 그린 그림'],{kind:'geometry',shape:'rectangle'},'입체도형을 잘라 펼친 그림을 전개도라고 해요.',r)
    }
    const w=ri(2,8,r),h=ri(2,8,r),z=ri(2,8,r);
    if(mode===0)return choice(unit,skill,'밑면이 서로 평행하고 합동인 다각형이며 옆면이 사각형인 입체도형은?','각기둥',['각뿔','원뿔','구'],{kind:'geometry',shape:'rectangle'},'두 밑면이 평행하고 합동인 다각형인 입체도형은 각기둥이에요.',r);
    if(mode===1)return number(unit,skill,`한 층에 ${w}개씩 ${h}층으로 쌓은 쌓기나무는 모두 몇 개일까요?`,w*h,graph([w,h]),`${w} × ${h} = ${w*h}개예요.`);
    if(mode===2)return choice(unit,skill,'서로 평행하고 합동인 두 원을 밑면으로 하는 입체도형은?','원기둥',['원뿔','구','각뿔'],{kind:'circle',focus:'given-radius',radius:w,unit:'cm'},'밑면이 원 두 개이고 옆면이 굽은 면인 입체도형은 원기둥이에요.',r);
    if(mode===3)return choice(unit,skill,'어느 방향에서 보아도 원으로 보이는 입체도형은?','구',['원기둥','원뿔','각기둥'],{kind:'circle',focus:'given-radius',radius:w,unit:'cm'},'구는 중심에서 겉면까지의 거리가 모두 같아요.',r);
    return number(unit,skill,`가로 ${w} cm, 세로 ${h} cm, 높이 ${z} cm인 직육면체의 부피는 몇 cm³일까요?`,w*h*z,{kind:'measure',measure:'capacity',values:[w,h,z],unit:'mL',labels:['가로','세로','높이']},`${w} × ${h} × ${z} = ${w*h*z} cm³예요.`)
  }
  const vals=[ri(1,5,r),ri(2,6,r),ri(1,5,r),ri(2,6,r)];
  const mode=mission%5;
  if(grade===1){const start=ri(40,70,r),step=mode===0||mode===1?10:1,answer=start+step*3;if(mode===0)return choice(unit,skill,'10개씩 묶음 7개는 얼마일까요?','70',['7','17','700'],graph([7]),'10이 7묶음이므로 70이에요.',r);if(mode===3)return choice(unit,skill,`${start+1}과 ${start+2} 중 더 큰 수는?`,String(start+2),[String(start+1),String(start),String(start+3)],graph([2,3]),'뒤에 오는 수가 1만큼 더 커요.',r);if(mode===4)return choice(unit,skill,`${start}, ${start+1}, □, ${start+3}에서 □는?`,String(start+2),[String(start+1),String(start+3),String(start+4)],graph([1,2,3,4]),'1씩 커지는 수의 순서를 따라가요.',r);return choice(unit,skill,`${start}, ${start+step}, ${start+step*2}, □에서 □는?`,String(answer),[String(answer-step),String(answer+step),String(answer+1)],graph([1,2,3,4]),`${step}씩 커지므로 ${answer}이에요.`,r)}
  if(grade===5){if(mode>=2){const red=ri(1,8,r),blue=ri(1,8,r),answer=red>blue?'빨간 공':'파란 공';return choice(unit,skill,`주머니에 빨간 공 ${red}개, 파란 공 ${blue}개가 있어요. 더 뽑힐 가능성이 큰 것은?`,red===blue?'두 색이 같아요':answer,[red===blue?'빨간 공':'두 색이 같아요',red===blue?'파란 공':answer==='빨간 공'?'파란 공':'빨간 공','절대 뽑을 수 없어요'],graph([red,blue]),'개수가 많을수록 뽑힐 가능성이 커요.',r)}const sum=vals.reduce((a,b)=>a+b,0),adjust=(4-sum%4)%4;vals[3]+=adjust;const avg=vals.reduce((a,b)=>a+b,0)/4;return number(unit,skill,mode===1?`네 날의 평균이 ${avg}라면 네 날의 합은 얼마일까요?`:`네 날의 기록은 ${vals.join(', ')}예요. 평균은 얼마일까요?`,mode===1?avg*4:avg,graph(vals),mode===1?`${avg} × 4 = ${avg*4}예요.`:`합 ${vals.reduce((a,b)=>a+b,0)}을 4로 나누면 평균은 ${avg}예요.`)}
  if(grade===6){const parts=[ri(10,30,r),ri(10,25,r),ri(10,20,r)],last=100-parts.reduce((a,b)=>a+b,0),all=[...parts,last],labels=['걷기','자전거','버스','자동차'];if(mode===0)return choice(unit,skill,`띠그래프에서 세 항목이 ${parts.join('%, ')}%예요. 나머지는?`,`${last}%`,[`${100-last}%`,`${last-10}%`,`${last+10}%`],graph(all),`전체 100%에서 세 비율을 빼면 ${last}%예요.`,r);if(mode>=2){const total=ri(2,8,r)*100,percent=all[mode-2],answer=total*percent/100;return number(unit,skill,`전체 ${total}명 중 ${percent}%는 몇 명일까요?`,answer,graph(all),`${total} × ${percent}/100 = ${answer}명이에요.`)}const largest=Math.max(...all),index=all.indexOf(largest);return choice(unit,skill,`원그래프의 비율이 ${all.join('%, ')}%예요. 가장 큰 항목은?`,labels[index],labels.filter((_,i)=>i!==index),graph(all),`가장 큰 비율 ${largest}%인 ${labels[index]}가 답이에요.`,r)}
  const max=Math.max(...vals),min=Math.min(...vals),idx=vals.indexOf(max);if(mode===3)return choice(unit,skill,'표나 그래프로 나타내면 좋은 점은?','자료의 크기를 한눈에 비교할 수 있어요',['시간을 잴 수 있어요','도형의 넓이가 바뀌어요','모든 수가 같아져요'],graph(vals),'표와 그래프는 자료의 크기와 차이를 쉽게 비교하게 해 줘요.',r);if(mode===4)return number(unit,skill,`가장 많은 항목과 가장 적은 항목의 차이는 몇 개일까요?`,max-min,graph(vals),`${max} - ${min} = ${max-min}개예요.`);return choice(unit,skill,mode===2?'꺾은선그래프에서 값이 가장 큰 항목은?':'그래프에서 가장 많은 항목은?',['가','나','다','라'][idx],['가','나','다','라'].filter((_,i)=>i!==idx),graph(vals),`${['가','나','다','라'][idx]}의 값이 ${max}로 가장 커요.`,r)
}
