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
    fractionDecimal: { icon: '🧮', name: '혼합계산마을', short: '괄호가 있는 자연수의 혼합 계산', semester: '1학기', topics: ['덧셈과 뺄셈', '곱셈과 나눗셈', '괄호', '계산 순서', '혼합 계산'] },
    circle: { icon: '🔷', name: '수직·평행·다각형정원', short: '수직과 평행, 다각형의 성질', semester: '2학기', topics: ['수직', '평행', '사각형', '다각형', '대각선'] },
    fraction: { icon: '🍰', name: '분수 계산섬', short: '분모가 같은 분수의 덧셈과 뺄셈', semester: '1학기', topics: ['진분수', '가분수와 대분수', '크기 비교', '분수 덧셈', '분수 뺄셈'] },
    measurement: { icon: '🔟', name: '소수와 어림마을', short: '소수의 덧셈·뺄셈과 올림·버림·반올림', semester: '2학기', topics: ['소수의 자릿값', '소수 덧셈', '소수 뺄셈', '반올림', '수의 범위'] },
    pictograph: { icon: '📈', name: '그래프 관측소', short: '막대그래프와 꺾은선그래프 해석', semester: '2학기', topics: ['막대그래프', '꺾은선그래프', '변화 읽기', '자료 비교', '그래프 해석'] },
  },
  5: {
    plane: { icon: '🔗', name: '약수와 배수마을', short: '약수·배수·공약수·공배수', semester: '1학기', topics: ['약수', '배수', '공약수', '최대공약수', '최소공배수'] },
    lengthTime: { icon: '🧮', name: '자연수 혼합계산길', short: '괄호와 사칙연산의 계산 순서', semester: '1학기', topics: ['덧셈과 뺄셈', '곱셈과 나눗셈', '괄호', '계산 순서', '혼합 계산'] },
    fractionDecimal: { icon: '🔟', name: '소수 곱셈마을', short: '자연수×소수와 소수×소수', semester: '2학기', topics: ['소수×자연수', '자연수×소수', '소수 한 자리 곱셈', '소수 두 자리 곱셈', '곱의 크기'] },
    circle: { icon: '🪞', name: '합동과 대칭정원', short: '합동·선대칭·점대칭 도형', semester: '2학기', topics: ['합동', '대응점', '대응변', '선대칭', '점대칭'] },
    fraction: { icon: '🍰', name: '분수 연산섬', short: '약분·통분과 분수의 덧셈·뺄셈·곱셈', semester: '1학기', topics: ['약분', '통분', '분수 덧셈', '분수 뺄셈', '분수 곱셈'] },
    measurement: { icon: '📐', name: '둘레와 넓이마을', short: '다각형의 둘레와 넓이, 직육면체', semester: '1학기', topics: ['다각형 둘레', '평행사변형 넓이', '삼각형 넓이', '사다리꼴 넓이', '직육면체'] },
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
const shuffled=<T>(items:T[],r:()=>number)=>[...items].sort(()=>r()-.5);
const choice=(unit:NewCurriculumUnitId,skill:string,prompt:string,answer:string,wrongs:string[],visual:CurriculumVisual,explanation:string,r:()=>number):CurriculumQuestion=>({unit,skill,prompt,kind:'choice',answer,choices:shuffled([answer,...wrongs.filter(x=>x!==answer)].slice(0,4),r).map(label=>({label,value:label})),visual,hints:[`그림과 ${skill}의 뜻을 먼저 살펴봐요.`,`보기의 값을 하나씩 비교해요.`,explanation],explanation});
const number=(unit:NewCurriculumUnitId,skill:string,prompt:string,answer:number,visual:CurriculumVisual,explanation:string):CurriculumQuestion=>({unit,skill,prompt,kind:'number',answer:String(answer),visual,hints:[`${skill}에서 무엇을 구하는지 찾아봐요.`,'식을 한 단계씩 써 보세요.',explanation],explanation});
const bars=(n:number,d:number):CurriculumVisual=>({kind:'fraction',numerator:n,denominator:d});
const graph=(values:number[]):CurriculumVisual=>({kind:'pictograph',icon:'●',value:1,rows:values.map((v,i)=>({label:['가','나','다','라'][i],icons:v}))});

export function generateGradeQuestion(grade: Exclude<SchoolGrade,3>, unit: NewCurriculumUnitId, mission: number, r:()=>number=Math.random): CurriculumQuestion {
  const skill=PLANS[grade][unit].topics[mission%5];
  if(unit==='plane'){
    const max=grade===1?100:grade===2?1000:grade===4?99999999:grade===5?9999:99;
    const a=ri(Math.max(1,Math.floor(max/10)),max,r), b=Math.max(1,a-ri(1,Math.max(2,Math.floor(a/3)),r));
    if(grade===5){ const n=ri(12,48,r), factors=Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0); return choice(unit,skill,`${n}의 약수인 것은 어느 것일까요?`,String(factors[ri(0,factors.length-1,r)]),[String(n-1),String(n+1),String(n+2)],graph([2,3,4]),`${n}을 나누어떨어지게 하는 수가 약수예요.`,r); }
    if(grade===6){ const d=ri(2,9,r), q=ri(2,8,r), n=ri(1,d-1,r); return choice(unit,skill,`${n}/${d} ÷ ${q}의 값은 얼마일까요?`,`${n}/${d*q}`,[`${n*q}/${d}`,`${n}/${d+q}`,`${q}/${n*d}`],bars(n,d*q),`분수÷자연수는 분모에 자연수를 곱해 ${n}/${d*q}가 돼요.`,r); }
    return choice(unit,skill,`${a}와 ${b} 중 더 큰 수를 골라요.`,String(Math.max(a,b)),[String(Math.min(a,b)),String(a+1),String(Math.max(0,b-1))],graph([2,4,3]),`높은 자리의 숫자부터 비교하면 ${Math.max(a,b)}이 더 커요.`,r);
  }
  if(unit==='lengthTime'){
    if(grade===1){const h=ri(1,11,r),half=mission%2===1;return choice(unit,skill,`시계의 짧은바늘이 ${h}과 ${h+1} 사이, 긴바늘이 ${half?'6':'12'}를 가리켜요. 알맞은 시각은?`,`${h}시${half?' 30분':''}`,[`${h+1}시`,`${h}시 ${half?'정각':'30분'}`,`${Math.max(1,h-1)}시`],{kind:'length-time',measure:'time',values:[h,half?30:0],unit:'분'},`긴바늘이 ${half?'6이면 30분,':'12이면 정각이고,'} 짧은바늘을 함께 읽어요.`,r)}
    if(grade===2){const h=ri(1,10,r),m=[0,10,20,30,40,50][ri(0,5,r)];return choice(unit,skill,`시계가 ${h}시 ${String(m).padStart(2,'0')}분을 가리켜요. 알맞은 시각은?`,`${h}시 ${m}분`,[`${h+1}시 ${m}분`,`${h}시 ${m===0?30:0}분`,`${m}시 ${h}분`],{kind:'length-time',measure:'time',values:[h,m],unit:'분'},`짧은바늘은 ${h}, 긴바늘은 ${m}분을 나타내요.`,r)}
    if(grade===5){const a=ri(2,9,r),b=ri(2,9,r),c=ri(1,9,r);const answer=a+b*c;return number(unit,skill,`${a} + ${b} × ${c}를 계산하면 얼마일까요?`,answer,graph([a,b,c]),`곱셈을 먼저 계산해 ${b} × ${c} = ${b*c}, 이어서 ${a}를 더해 ${answer}예요.`)}
    if(grade===6){const divisor=ri(2,9,r),quotient=ri(12,48,r)/10,dividend=Number((divisor*quotient).toFixed(1));return choice(unit,skill,`${dividend} ÷ ${divisor}의 몫은 얼마일까요?`,String(quotient),[String(quotient*10),String(quotient/10),String(quotient+1)],{kind:'decimal',tenths:Math.min(9,Math.round(quotient))},`${dividend} ÷ ${divisor} = ${quotient}예요.`,r)}
    const a=ri(20,80,r),b=ri(10,40,r);return number(unit,skill,`${a}°인 각과 ${b}°인 각을 이어 붙였어요. 각의 크기는 몇 도일까요?`,a+b,{kind:'geometry',shape:'angle',label:`${a}° + ${b}°`},`${a} + ${b} = ${a+b}°예요.`)
  }
  if(unit==='fractionDecimal'){
    if(grade===1){const total=ri(5,10,r),left=ri(1,total-1,r);return choice(unit,skill,`${total}을 ${left}와 어떤 수로 가르면 될까요?`,String(total-left),[String(left),String(total-left+1),String(Math.max(0,total-left-1))],graph([left,total-left]),`${left} + ${total-left} = ${total}이므로 빈칸은 ${total-left}이에요.`,r)}
    if(grade===2){const m=ri(1,4,r),cm=ri(1,9,r)*10;return choice(unit,skill,`${m} m ${cm} cm를 cm로 나타내면?`,String(m*100+cm),[String(m*10+cm),String(m*100+cm+10),String(cm)],{kind:'length-time',measure:'length',values:[m,cm],unit:'cm'},`1 m는 100 cm이므로 ${m*100} + ${cm} = ${m*100+cm} cm예요.`,r)}
    if(grade===4){const a=ri(3,9,r),b=ri(2,8,r),c=ri(1,7,r);const answer=(a+b)*c;return number(unit,skill,`(${a} + ${b}) × ${c}를 계산하면 얼마일까요?`,answer,graph([a,b,c]),`괄호 안을 먼저 계산해 ${a+b} × ${c} = ${answer}예요.`)}
    if(grade===5){const a=ri(2,9,r),b=ri(2,9,r),answer=String(a*b/10);return choice(unit,skill,`${a/10} × ${b}는 얼마일까요?`,answer,[String(a*b),String(a*b/100),String((a+b)/10)],graph([a,b]),`${a/10} × ${b} = ${answer}이에요.`,r)}
    const part=ri(10,80,r);return choice(unit,skill,`전체의 ${part}%를 소수로 나타내면?`,String(part/100),[String(part/10),String(part),String((100-part)/100)],{kind:'decimal',tenths:Math.min(9,Math.round(part/10))},`${part}% = ${part}/100 = ${part/100}예요.`,r)
  }
  if(unit==='circle'){
    if(grade<=2){const shapes=['삼각형','사각형','원'];const answer=shapes[ri(0,2,r)];return choice(unit,skill,`${answer}의 특징으로 알맞은 것은?`,answer==='원'?'뾰족한 꼭짓점이 없어요':answer==='삼각형'?'곧은 변이 3개예요':'곧은 변이 4개예요',['곧은 변이 2개예요','꼭짓점이 5개예요','모든 선이 둥글어요'],{kind:'geometry',shape:answer==='삼각형'?'right-triangle':answer==='사각형'?'rectangle':'angle'},`${answer}의 변과 꼭짓점을 세어 보면 알 수 있어요.`,r)}
    if(grade===4)return choice(unit,skill,'두 직선이 만나 이루는 각이 직각일 때 두 직선의 관계는?','수직',['평행','합동','대칭'],{kind:'geometry',shape:'angle',label:'90°'},'직각으로 만나는 두 직선은 서로 수직이에요.',r)
    if(grade===5)return choice(unit,skill,'서로 포개었을 때 완전히 겹치는 두 도형을 무엇이라고 할까요?','합동',['대칭','수직','평행'],{kind:'geometry',shape:'rectangle'},'모양과 크기가 같아 완전히 겹치는 도형은 합동이에요.',r)
    const radius=ri(2,9,r),answer=(radius*radius*3.14).toFixed(2);return choice(unit,skill,`반지름이 ${radius} cm인 원의 넓이를 원주율 3.14로 구하면 몇 cm²일까요?`,answer,[(radius*2*3.14).toFixed(2),(radius*radius).toFixed(2),(radius*3.14).toFixed(2)],{kind:'circle',focus:'given-radius',radius,unit:'cm'},`${radius} × ${radius} × 3.14 = ${answer} cm²예요.`,r)
  }
  if(unit==='fraction'){
    const d=grade<=2?ri(2,6,r):ri(3,9,r),n=ri(1,d-1,r);
    if(grade===1){const order=ri(2,5,r);return choice(unit,skill,`왼쪽부터 별, 나무, 집, 연못, 꽃이 있어요. ${order}번째에 있는 것은?`,['별','나무','집','연못','꽃'][order-1],['별','나무','집','연못','꽃'].filter((_,i)=>i!==order-1),graph([1,2,3,4]),`왼쪽부터 차례로 세면 ${order}번째는 ${['별','나무','집','연못','꽃'][order-1]}이에요.`,r)}
    if(grade===2){const start=ri(1,5,r),step=ri(2,5,r),answer=start+step*3;return choice(unit,skill,`${start}, ${start+step}, ${start+step*2}, □의 규칙에서 □는?`,String(answer),[String(answer-1),String(answer+1),String(answer+step)],graph([1,2,3,4]),`${step}씩 커지는 규칙이므로 ${answer}예요.`,r)}
    if(grade===4){const b=ri(1,d-n,r);return choice(unit,skill,`${n}/${d} + ${b}/${d}는 얼마일까요?`,`${n+b}/${d}`,[`${n+b}/${d*2}`,`${Math.abs(n-b)}/${d}`,`${n*b}/${d}`],bars(n+b,d),`분모는 그대로 두고 분자끼리 더해 ${n+b}/${d}예요.`,r)}
    if(grade===5){const d2=ri(2,8,r),answerN=n*d2+1*d;const answerD=d*d2;return choice(unit,skill,`${n}/${d} + 1/${d2}의 계산 결과와 같은 것은?`,`${answerN}/${answerD}`,[`${n+1}/${d+d2}`,`${n+1}/${answerD}`,`${answerN+1}/${answerD}`],bars(Math.min(answerN,answerD),answerD),`공통분모 ${answerD}로 통분하면 ${answerN}/${answerD}예요.`,r)}
    const a=ri(1,5,r),b=ri(2,6,r);return choice(unit,skill,`비 ${a}:${b}와 같은 비는?`,`${a*2}:${b*2}`,[`${a+2}:${b+2}`,`${b}:${a}`,`${a}:${b+2}`],graph([a,b]),`두 항에 같은 수 2를 곱하면 ${a*2}:${b*2}예요.`,r)
  }
  if(unit==='measurement'){
    if(grade===1){const a=ri(2,9,r),b=ri(2,9,r);return choice(unit,skill,`물병 A에는 ${a}컵, B에는 ${b}컵이 들어가요. 더 많이 담는 것은?`,a>b?'A':'B',['두 병이 같아요',a>b?'B':'A','알 수 없어요'],{kind:'measure',measure:'capacity',values:[a,b],unit:'mL',labels:['A','B']},`${Math.max(a,b)}컵이 ${Math.min(a,b)}컵보다 많아요.`,r)}
    if(grade===2){const red=ri(2,6,r),blue=ri(2,6,r);return choice(unit,skill,`빨간 단추 ${red}개와 파란 단추 ${blue}개를 색깔로 분류했어요. 모두 몇 개일까요?`,String(red+blue),[String(Math.abs(red-blue)),String(red),String(blue)],graph([red,blue]),`분류한 두 모둠을 합하면 ${red} + ${blue} = ${red+blue}개예요.`,r)}
    if(grade===4){const base=ri(120,980,r),place=[10,100][mission%2];const answer=Math.round(base/place)*place;return choice(unit,skill,`${base}을 ${place===10?'십':'백'}의 자리에서 반올림하면?`,String(answer),[String(Math.floor(base/place)*place),String(Math.ceil(base/place)*place),String(base)],graph([2,3,4]),`바로 아래 자리의 숫자를 보고 반올림하면 ${answer}이에요.`,r)}
    if(grade===5){const w=ri(3,12,r),h=ri(2,9,r);return number(unit,skill,`밑변 ${w} cm, 높이 ${h} cm인 평행사변형의 넓이는 몇 cm²일까요?`,w*h,{kind:'geometry',shape:'rectangle',label:`${w} cm × ${h} cm`},`${w} × ${h} = ${w*h} cm²예요.`)}
    const w=ri(2,8,r),h=ri(2,8,r),z=ri(2,8,r);return number(unit,skill,`가로 ${w} cm, 세로 ${h} cm, 높이 ${z} cm인 직육면체의 부피는 몇 cm³일까요?`,w*h*z,{kind:'measure',measure:'capacity',values:[w,h,z],unit:'mL',labels:['가로','세로','높이']},`${w} × ${h} × ${z} = ${w*h*z} cm³예요.`)
  }
  const vals=[ri(1,5,r),ri(2,6,r),ri(1,5,r),ri(2,6,r)];
  if(grade===5){const sum=vals.reduce((a,b)=>a+b,0),adjust=(4-sum%4)%4;vals[3]+=adjust;const avg=vals.reduce((a,b)=>a+b,0)/4;return number(unit,skill,`네 날의 기록은 ${vals.join(', ')}예요. 평균은 얼마일까요?`,avg,graph(vals),`합 ${vals.reduce((a,b)=>a+b,0)}을 4로 나누면 평균은 ${avg}예요.`)}
  if(grade===6){const parts=[ri(10,40,r),ri(10,30,r),ri(10,20,r)];const last=100-parts.reduce((a,b)=>a+b,0);const largest=Math.max(...parts,last);const labels=['걷기','자전거','버스','자동차'];const index=[...parts,last].indexOf(largest);return choice(unit,skill,`원그래프의 비율이 ${parts[0]}%, ${parts[1]}%, ${parts[2]}%, 나머지로 나타났어요. 가장 큰 항목은?`,labels[index],labels.filter((_,i)=>i!==index),graph([parts[0],parts[1],parts[2],last]),`나머지는 ${last}%이고, 가장 큰 비율 ${largest}%인 ${labels[index]}가 답이에요.`,r)}
  const max=Math.max(...vals),idx=vals.indexOf(max);return choice(unit,skill,'그림그래프에서 가장 많은 것은 어느 항목일까요?',['가','나','다','라'][idx],['가','나','다','라'].filter((_,i)=>i!==idx),graph(vals),`${['가','나','다','라'][idx]}의 그림 수가 ${max}개로 가장 많아요.`,r)
}
