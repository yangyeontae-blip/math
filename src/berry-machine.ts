import type {Save} from './rules';
export type BerryMachine={level:number;charge:number;produced:number};
export const MACHINE_COSTS=[2000,8000,25000] as const;
export const MACHINE_YIELD=[0,400,1000,2500] as const;
export const emptyBerryMachine=():BerryMachine=>({level:0,charge:0,produced:0});
export function validBerryMachine(v:unknown):v is BerryMachine{const m=v as BerryMachine;return !!m&&Number.isInteger(m.level)&&m.level>=0&&m.level<=3&&Number.isInteger(m.charge)&&m.charge>=0&&m.charge<=10&&(m.level>0||m.charge===0)&&Number.isSafeInteger(m.produced)&&m.produced>=0&&m.produced<=1e9;}
export const berryMachineMultiplier=(s:Save)=>1+s.career.machine.level*.1;
export function chargeBerryMachine(s:Save){const m=s.career.machine;if(m.level>0)m.charge=Math.min(10,m.charge+1);}
export function upgradeBerryMachine(s:Save){const m=s.career.machine,cost=MACHINE_COSTS[m.level];if(cost===undefined)throw Error('최고 단계의 베리 풍차예요.');if(s.berries<cost)throw Error((cost-s.berries)+'베리가 더 필요해요.');s.berries-=cost;m.level++;return '베리 풍차 '+m.level+'단계 · 수학·사냥 베리 +'+m.level*10+'%';}
export function harvestBerryMachine(s:Save){const m=s.career.machine;if(!m.level||m.charge<10)throw Error('정답이나 사냥으로 힘을 10칸 채워요.');const amount=Math.min(MACHINE_YIELD[m.level],1e9-s.berries);if(!amount)throw Error('베리를 먼저 사용하고 다시 와요.');s.berries+=amount;m.charge=0;m.produced=Math.min(1e9,m.produced+amount);return '베리 풍차에서 '+amount.toLocaleString()+'베리를 받았어요!';}
export function showBerryMachine(s:Save,h:{open:(html:string)=>void;persist:()=>void;refresh:()=>void;toast:(text:string)=>void}){
 const show=()=>{const m=s.career.machine,cost=MACHINE_COSTS[m.level];h.open('<section class="career-sheet berry-machine-sheet"><header class="career-heading"><small>상점거리 · 모험 공방</small><h2>🍓 베리 풍차</h2><p>모험하며 베리를 더 모으는 나의 장치예요.</p></header><p>현재 '+m.level+' / 3단계 · 🍓 '+s.berries.toLocaleString()+'베리</p><p>현재 수학 몬스터·사냥 베리 +'+m.level*10+'%. 정답 하나 또는 사냥 한 마리마다 힘이 한 칸 차요. 열 칸이 차면 추가 베리를 받아요. 쉬는 동안 힘이 줄지 않아요.</p><progress max="10" value="'+m.charge+'" aria-label="풍차 힘 '+m.charge+' / 10"></progress><strong>힘 '+m.charge+' / 10</strong><p>추가 수확 '+MACHINE_YIELD[m.level].toLocaleString()+'베리 · 누적 수확 '+m.produced.toLocaleString()+'베리</p><button id="machine-upgrade" class="primary wide" '+(cost===undefined?'disabled':'')+'>'+(cost===undefined?'최고 단계예요':m.level===0?'풍차 만들기 · '+cost.toLocaleString()+'베리':'풍차 '+(m.level+1)+'단계 · '+cost.toLocaleString()+'베리')+'</button><button id="machine-harvest" class="secondary wide" '+(m.charge<10?'disabled':'')+'>풍차의 베리 받기</button><p class="note">강화는 확정이며 실패·파괴가 없어요. 학습 진도와 정답은 풍차가 대신하지 않아요. 연습 허수아비와 친구 대전은 힘을 채우지 않아요. 풍차와 힘은 모험 저장 파일에 함께 남아요.</p><button class="secondary wide" data-close>게임으로 돌아가기</button></section>');
  const action=(f:()=>string)=>{try{const message=f();h.persist();h.refresh();h.toast(message);show();}catch(error){h.toast((error as Error).message);}};
  document.querySelector<HTMLButtonElement>('#machine-upgrade')!.onclick=()=>action(()=>upgradeBerryMachine(s));document.querySelector<HTMLButtonElement>('#machine-harvest')!.onclick=()=>action(()=>harvestBerryMachine(s));
 };show();
}
