import type { CurriculumQuestion, CurriculumMission, CurriculumVisual } from './curriculum';
import type { CurriculumUnitId, NewCurriculumUnitId, SchoolGrade } from './rules';

export interface GradeRegion { id: CurriculumUnitId; icon: string; name: string; short: string; className: string; semester: '1학기' | '2학기' | '공통' }

type UnitPlan = { icon: string; name: string; short: string; topics: string[] };
type GradePlan = Record<NewCurriculumUnitId, UnitPlan>;

const PLANS: Record<Exclude<SchoolGrade, 3>, GradePlan> = {
  1: {
    plane: { icon: '🔢', name: '반짝 수마을', short: '0부터 100까지 수와 순서', topics: ['수 세기', '수의 순서', '수 비교', '몇십과 몇', '100까지의 수'] },
    lengthTime: { icon: '📏', name: '쭉쭉 길이길', short: '길이 비교와 cm', topics: ['길이 비교', '직접 비교', 'cm', '길이 재기', '길이 어림'] },
    fractionDecimal: { icon: '🧩', name: '규칙 무늬마을', short: '모양과 수의 규칙', topics: ['반복 규칙', '수 배열', '모양 배열', '규칙 찾기', '규칙 만들기'] },
    circle: { icon: '🔺', name: '알록달록 모양정원', short: '삼각형·사각형·원', topics: ['삼각형', '사각형', '원', '모양 분류', '모양 만들기'] },
    fraction: { icon: '🍰', name: '똑같이 나눔섬', short: '전체와 부분, 똑같이 나누기', topics: ['전체와 부분', '반으로 나누기', '똑같이 나누기', '부분 세기', '나눔 이야기'] },
    measurement: { icon: '⚖️', name: '비교 저울마을', short: '길이·무게·넓이·들이 비교', topics: ['무게 비교', '넓이 비교', '들이 비교', '순서 정하기', '생활 속 비교'] },
    pictograph: { icon: '📊', name: '그림표 관측소', short: '분류하고 표로 나타내기', topics: ['기준 정하기', '분류하기', '개수 세기', '표 읽기', '가장 많은 것'] },
  },
  2: {
    plane: { icon: '🔢', name: '천까지 수마을', short: '세 자리 수와 자릿값', topics: ['백 알아보기', '세 자리 수', '자릿값', '수 비교', '수의 규칙'] },
    lengthTime: { icon: '🕰️', name: '똑딱 시계마을', short: '시각과 시간, 하루', topics: ['몇 시', '몇 시 몇 분', '시간', '하루', '달력'] },
    fractionDecimal: { icon: '📏', name: '한미터 길이길', short: 'cm와 m, 길이 계산', topics: ['1 m', 'cm와 m', '길이 합', '길이 차', '길이 어림'] },
    circle: { icon: '🔷', name: '여러 모양정원', short: '삼각형·사각형·원과 쌓기나무', topics: ['삼각형', '사각형', '원', '모양 만들기', '쌓기나무'] },
    fraction: { icon: '🍕', name: '분수 첫걸음섬', short: '똑같이 나눈 한 부분', topics: ['똑같이 나누기', '한 부분', '분수 읽기', '부분의 수', '분수 이야기'] },
    measurement: { icon: '💧', name: '들이 저울마을', short: '들이와 무게 비교', topics: ['들이 비교', '무게 비교', '어림', '순서', '생활 속 측정'] },
    pictograph: { icon: '📋', name: '표와 그래프 관측소', short: '자료를 표와 그래프로 나타내기', topics: ['분류', '표 읽기', '그래프 읽기', '자료 비교', '자료 이야기'] },
  },
  4: {
    plane: { icon: '🔢', name: '큰 수 별마을', short: '만·억·조와 큰 수 비교', topics: ['만', '억', '조', '자릿값', '큰 수 비교'] },
    lengthTime: { icon: '📐', name: '각도 바람길', short: '각의 크기와 각도', topics: ['각도', '직각', '예각과 둔각', '각도 계산', '회전'] },
    fractionDecimal: { icon: '➗', name: '나눗셈 기계마을', short: '세 자리 수 ÷ 두 자리 수', topics: ['몇십으로 나누기', '두 자리 수로 나누기', '몫 어림', '나머지', '검산'] },
    circle: { icon: '🔷', name: '다각형 정원', short: '삼각형·사각형·다각형', topics: ['삼각형', '사각형', '수직과 평행', '다각형', '대각선'] },
    fraction: { icon: '🍰', name: '분수 계산섬', short: '분모가 같은 분수의 덧셈과 뺄셈', topics: ['진분수', '가분수와 대분수', '크기 비교', '분수 덧셈', '분수 뺄셈'] },
    measurement: { icon: '▦', name: '넓이 타일마을', short: '직사각형과 정사각형의 넓이', topics: ['1 cm²', '직사각형 넓이', '정사각형 넓이', '넓이 비교', '복합 도형'] },
    pictograph: { icon: '📈', name: '꺾은선 관측소', short: '막대그래프와 꺾은선그래프', topics: ['막대그래프', '꺾은선그래프', '변화 읽기', '자료 비교', '그래프 해석'] },
  },
  5: {
    plane: { icon: '🔗', name: '약수 배수마을', short: '약수·배수·공약수·공배수', topics: ['약수', '배수', '공약수', '공배수', '약분과 통분'] },
    lengthTime: { icon: '🧮', name: '혼합계산 숲길', short: '자연수의 혼합 계산', topics: ['덧셈과 뺄셈', '곱셈과 나눗셈', '괄호', '계산 순서', '혼합 계산'] },
    fractionDecimal: { icon: '🔟', name: '소수 곱셈마을', short: '소수의 곱셈', topics: ['소수와 자연수', '소수 한 자리', '소수 두 자리', '곱의 크기', '소수 곱셈'] },
    circle: { icon: '🪞', name: '합동 대칭정원', short: '합동과 선대칭·점대칭', topics: ['합동', '대응점', '선대칭', '점대칭', '대칭 도형'] },
    fraction: { icon: '🍰', name: '분수 연산섬', short: '분모가 다른 분수의 덧셈과 뺄셈', topics: ['통분', '크기 비교', '분수 덧셈', '분수 뺄셈', '대분수 계산'] },
    measurement: { icon: '📦', name: '넓이 부피마을', short: '다각형의 넓이와 직육면체', topics: ['평행사변형 넓이', '삼각형 넓이', '사다리꼴 넓이', '직육면체', '부피'] },
    pictograph: { icon: '📊', name: '평균 가능성관측소', short: '평균과 가능성', topics: ['평균', '합계 구하기', '가능성', '자료 비교', '자료 해석'] },
  },
  6: {
    plane: { icon: '➗', name: '분수 나눗셈마을', short: '분수의 나눗셈', topics: ['분수÷자연수', '자연수÷분수', '분수÷분수', '역수', '분수 나눗셈'] },
    lengthTime: { icon: '🔟', name: '소수 나눗셈숲길', short: '소수의 나눗셈', topics: ['소수÷자연수', '자연수÷소수', '소수÷소수', '몫 어림', '소수 나눗셈'] },
    fractionDecimal: { icon: '⚖️', name: '비와 비율마을', short: '비·비율·백분율', topics: ['비', '비율', '백분율', '비율 비교', '생활 속 비율'] },
    circle: { icon: '⭕', name: '원 넓이정원', short: '원의 둘레와 넓이', topics: ['원주', '원주율', '원의 둘레', '원의 넓이', '원 활용'] },
    fraction: { icon: '📐', name: '비례 모험섬', short: '비례식과 비례배분', topics: ['비의 성질', '비례식', '비례식 계산', '비례배분', '생활 속 비례'] },
    measurement: { icon: '🧊', name: '입체도형마을', short: '각기둥·각뿔·원기둥', topics: ['각기둥', '각뿔', '원기둥', '전개도', '부피와 겉넓이'] },
    pictograph: { icon: '📈', name: '자료 분석관측소', short: '띠그래프·원그래프와 자료 해석', topics: ['띠그래프', '원그래프', '백분율 읽기', '자료 비교', '자료 해석'] },
  },
};

const OPS: Record<SchoolGrade, Partial<Record<'addition'|'subtraction'|'multiplication'|'division', Omit<GradeRegion, 'semester'>>>> = {
  1: { addition: { id:'addition', icon:'🍎', name:'모으기 덧셈숲', short:'합이 20까지인 덧셈', className:'addition' }, subtraction: { id:'subtraction', icon:'🍂', name:'가르기 뺄셈숲', short:'20까지의 뺄셈', className:'subtraction' } },
  2: { addition: { id:'addition', icon:'🍎', name:'받아올림 덧셈숲', short:'두 자리 수의 덧셈', className:'addition' }, subtraction: { id:'subtraction', icon:'🍂', name:'받아내림 뺄셈숲', short:'두 자리 수의 뺄셈', className:'subtraction' }, multiplication: { id:'multiplication', icon:'🌻', name:'구구단 곱셈숲', short:'2단부터 9단까지', className:'multiplication' } },
  3: {},
  4: { addition: { id:'addition', icon:'🍎', name:'큰 수 덧셈숲', short:'큰 수의 덧셈', className:'addition' }, subtraction: { id:'subtraction', icon:'🍂', name:'큰 수 뺄셈숲', short:'큰 수의 뺄셈', className:'subtraction' }, multiplication: { id:'multiplication', icon:'🌻', name:'큰 수 곱셈숲', short:'세 자리 수의 곱셈', className:'multiplication' }, division: { id:'division', icon:'🌿', name:'큰 수 나눗셈숲', short:'두 자리 수로 나누기', className:'division' } },
  5: { addition: { id:'addition', icon:'🍎', name:'수 감각 덧셈숲', short:'큰 수와 소수의 덧셈', className:'addition' }, subtraction: { id:'subtraction', icon:'🍂', name:'수 감각 뺄셈숲', short:'큰 수와 소수의 뺄셈', className:'subtraction' }, multiplication: { id:'multiplication', icon:'🌻', name:'곱셈 전략숲', short:'자연수와 소수의 곱셈', className:'multiplication' }, division: { id:'division', icon:'🌿', name:'나눗셈 전략숲', short:'자연수의 나눗셈', className:'division' } },
  6: { addition: { id:'addition', icon:'🍎', name:'연산 연결숲', short:'분수·소수 덧셈 복습', className:'addition' }, subtraction: { id:'subtraction', icon:'🍂', name:'연산 탐구숲', short:'분수·소수 뺄셈 복습', className:'subtraction' }, multiplication: { id:'multiplication', icon:'🌻', name:'비율 곱셈숲', short:'분수·소수의 곱셈', className:'multiplication' }, division: { id:'division', icon:'🌿', name:'비율 나눗셈숲', short:'분수·소수의 나눗셈', className:'division' } },
};

export function gradeRegions(grade: SchoolGrade): { first: GradeRegion[]; second: GradeRegion[] } | null {
  if (grade === 3) return null;
  const plan = PLANS[grade], ops = Object.values(OPS[grade]).map(region => ({ ...region!, semester: '공통' as const }));
  const extras = (Object.entries(plan) as [NewCurriculumUnitId, UnitPlan][]).map(([id, item], index): GradeRegion => ({ id, icon:item.icon, name:item.name, short:item.short, className:id.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), semester:index < 3 ? '1학기' : '2학기' }));
  return { first: [...ops.filter((_, i) => i < Math.ceil(ops.length / 2)), ...extras.filter(x => x.semester === '1학기')], second: [...ops.filter((_, i) => i >= Math.ceil(ops.length / 2)), ...extras.filter(x => x.semester === '2학기')] };
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
    if(grade>=5){ const n=ri(12,48,r), factors=Array.from({length:n},(_,i)=>i+1).filter(x=>n%x===0); return choice(unit,skill,`${n}의 약수인 것은 어느 것일까요?`,String(factors[ri(0,factors.length-1,r)]),[String(n-1),String(n+1),String(n+2)],graph([2,3,4]),`${n}을 나누어떨어지게 하는 수가 약수예요.`,r); }
    return choice(unit,skill,`${a}와 ${b} 중 더 큰 수를 골라요.`,String(Math.max(a,b)),[String(Math.min(a,b)),String(a+1),String(Math.max(0,b-1))],graph([2,4,3]),`높은 자리의 숫자부터 비교하면 ${Math.max(a,b)}이 더 커요.`,r);
  }
  if(unit==='lengthTime'){
    if(grade===1){const a=ri(4,15,r),b=ri(1,a-1,r);return number(unit,skill,`${a} cm 리본에서 ${b} cm를 사용했어요. 몇 cm 남았을까요?`,a-b,{kind:'length-time',measure:'length',values:[a,b],unit:'cm'},`${a} − ${b} = ${a-b} cm예요.`)}
    if(grade===2){const h=ri(1,10,r),m=[0,10,20,30,40,50][ri(0,5,r)];return choice(unit,skill,`시계가 ${h}시 ${String(m).padStart(2,'0')}분을 가리켜요. 알맞은 시각은?`,`${h}시 ${m}분`,[`${h+1}시 ${m}분`,`${h}시 ${m===0?30:0}분`,`${m}시 ${h}분`],{kind:'length-time',measure:'time',values:[h,m],unit:'분'},`짧은바늘은 ${h}, 긴바늘은 ${m}분을 나타내요.`,r)}
    const a=ri(20,80,r),b=ri(10,40,r);return number(unit,skill,`${a}°인 각과 ${b}°인 각을 이어 붙였어요. 각의 크기는 몇 도일까요?`,a+b,{kind:'geometry',shape:'angle',label:`${a}° + ${b}°`},`${a} + ${b} = ${a+b}°예요.`)
  }
  if(unit==='fractionDecimal'){
    if(grade<=2){const start=ri(1,5,r),step=ri(1,3,r),answer=start+step*3;return choice(unit,skill,`${start}, ${start+step}, ${start+step*2}, □ 규칙에서 □에 알맞은 수는?`,String(answer),[String(answer-1),String(answer+1),String(start+step*4)],graph([1,2,3]),`${step}씩 커지므로 다음 수는 ${answer}예요.`,r)}
    if(grade===4){const d=ri(11,29,r),q=ri(3,9,r),n=d*q;return number(unit,skill,`${n}개의 열매를 ${d}개씩 묶으면 몇 묶음일까요?`,q,{kind:'groups',total:n,divisor:d,remainder:0},`${n} ÷ ${d} = ${q}예요.`)}
    if(grade===5){const a=ri(2,9,r),b=ri(2,9,r),answer=String(a*b/10);return choice(unit,skill,`${a/10} × ${b}는 얼마일까요?`,answer,[String(a*b),String(a*b/100),String((a+b)/10)],graph([a,b]),`${a/10} × ${b} = ${answer}이에요.`,r)}
    const part=ri(10,80,r);return choice(unit,skill,`전체의 ${part}%를 소수로 나타내면?`,String(part/100),[String(part/10),String(part),String((100-part)/100)],{kind:'decimal',tenths:Math.min(9,Math.round(part/10))},`${part}% = ${part}/100 = ${part/100}예요.`,r)
  }
  if(unit==='circle'){
    if(grade<=2){const shapes=['삼각형','사각형','원'];const answer=shapes[ri(0,2,r)];return choice(unit,skill,`${answer}의 특징으로 알맞은 것은?`,answer==='원'?'뾰족한 꼭짓점이 없어요':answer==='삼각형'?'곧은 변이 3개예요':'곧은 변이 4개예요',['곧은 변이 2개예요','꼭짓점이 5개예요','모든 선이 둥글어요'],{kind:'geometry',shape:answer==='삼각형'?'right-triangle':answer==='사각형'?'rectangle':'angle'},`${answer}의 변과 꼭짓점을 세어 보면 알 수 있어요.`,r)}
    if(grade===6){const radius=ri(2,9,r),answer=(radius*radius*3.14).toFixed(2);return choice(unit,skill,`반지름이 ${radius} cm인 원의 넓이를 원주율 3.14로 구하면 몇 cm²일까요?`,answer,[(radius*2*3.14).toFixed(2),(radius*radius).toFixed(2),(radius*3.14).toFixed(2)],{kind:'circle',focus:'given-radius',radius,unit:'cm'},`${radius} × ${radius} × 3.14 = ${answer} cm²예요.`,r)}
    return choice(unit,skill,'서로 포개었을 때 완전히 겹치는 두 도형을 무엇이라고 할까요?','합동',['대칭','수직','평행'],{kind:'geometry',shape:'rectangle'},'모양과 크기가 같아 완전히 겹치는 도형은 합동이에요.',r)
  }
  if(unit==='fraction'){
    const d=grade<=2?ri(2,6,r):ri(3,9,r),n=ri(1,d-1,r);
    if(grade<=2)return choice(unit,skill,`전체를 똑같이 ${d}조각으로 나눈 것 중 ${n}조각을 나타낸 분수는?`,`${n}/${d}`,[`${d}/${n}`,`1/${d}`,`${Math.min(d,n+1)}/${d}`],bars(n,d),`전체 조각 수 ${d}는 분모, 고른 조각 수 ${n}은 분자예요.`,r);
    if(grade===4){const b=ri(1,d-n,r);return choice(unit,skill,`${n}/${d} + ${b}/${d}는 얼마일까요?`,`${n+b}/${d}`,[`${n+b}/${d*2}`,`${Math.abs(n-b)}/${d}`,`${n*b}/${d}`],bars(n+b,d),`분모는 그대로 두고 분자끼리 더해 ${n+b}/${d}예요.`,r)}
    if(grade===5){const d2=ri(2,8,r),answerN=n*d2+1*d;const answerD=d*d2;return choice(unit,skill,`${n}/${d} + 1/${d2}의 계산 결과와 같은 것은?`,`${answerN}/${answerD}`,[`${n+1}/${d+d2}`,`${n+1}/${answerD}`,`${answerN+1}/${answerD}`],bars(Math.min(answerN,answerD),answerD),`공통분모 ${answerD}로 통분하면 ${answerN}/${answerD}예요.`,r)}
    const a=ri(1,5,r),b=ri(2,6,r);return choice(unit,skill,`비 ${a}:${b}와 같은 비는?`,`${a*2}:${b*2}`,[`${a+2}:${b+2}`,`${b}:${a}`,`${a}:${b+2}`],graph([a,b]),`두 항에 같은 수 2를 곱하면 ${a*2}:${b*2}예요.`,r)
  }
  if(unit==='measurement'){
    if(grade<=2){const a=ri(2,9,r),b=ri(2,9,r);return choice(unit,skill,`물병 A에는 ${a}컵, B에는 ${b}컵이 들어가요. 더 많이 담는 것은?`,a>b?'A':'B',['두 병이 같아요',a>b?'B':'A','알 수 없어요'],{kind:'measure',measure:'capacity',values:[a,b],unit:'mL',labels:['A','B']},`${Math.max(a,b)}컵이 ${Math.min(a,b)}컵보다 많아요.`,r)}
    if(grade===4){const w=ri(3,12,r),h=ri(2,9,r);return number(unit,skill,`가로 ${w} cm, 세로 ${h} cm인 직사각형의 넓이는 몇 cm²일까요?`,w*h,{kind:'geometry',shape:'rectangle',label:`${w} cm × ${h} cm`},`${w} × ${h} = ${w*h} cm²예요.`)}
    const w=ri(2,8,r),h=ri(2,8,r),z=ri(2,8,r);return number(unit,skill,`가로 ${w} cm, 세로 ${h} cm, 높이 ${z} cm인 직육면체의 부피는 몇 cm³일까요?`,w*h*z,{kind:'measure',measure:'capacity',values:[w,h,z],unit:'mL',labels:['가로','세로','높이']},`${w} × ${h} × ${z} = ${w*h*z} cm³예요.`)
  }
  const vals=[ri(1,5,r),ri(2,6,r),ri(1,5,r),ri(2,6,r)];
  if(grade>=5){const sum=vals.reduce((a,b)=>a+b,0),adjust=(4-sum%4)%4;vals[3]+=adjust;const avg=vals.reduce((a,b)=>a+b,0)/4;return number(unit,skill,`네 날의 기록은 ${vals.join(', ')}예요. 평균은 얼마일까요?`,avg,graph(vals),`합 ${vals.reduce((a,b)=>a+b,0)}을 4로 나누면 평균은 ${avg}예요.`)}
  const max=Math.max(...vals),idx=vals.indexOf(max);return choice(unit,skill,'그림그래프에서 가장 많은 것은 어느 항목일까요?',['가','나','다','라'][idx],['가','나','다','라'].filter((_,i)=>i!==idx),graph(vals),`${['가','나','다','라'][idx]}의 그림 수가 ${max}개로 가장 많아요.`,r)
}
