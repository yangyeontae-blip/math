import type { Save } from './rules';
import { WEAPONS, OUTFITS } from './rules';
import { WORLD_TWO_NAME, WORLD_TWO_REGIONS, WORLD_TWO_BOSSES, WORLD_TWO_CORE_REGIONS, canEnterWorldTwo, worldTwoEquipmentSource } from './world-two';
import { worldTwoRewardFor } from './world-two-rules';

function regionCards(s:Save,from:number,to:number) {
  return WORLD_TWO_REGIONS.slice(from,to).map(region=>{
    const {id,level,icon,name,description,killGoal,bonus}=region;
    const progress=s.world2.regions[id],open=canEnterWorldTwo(s.world2,s.level,id),reward=worldTwoRewardFor(s,id);
    return `<article class="world-two-region theme-${id}">
      <span class="world-two-icon">${icon}</span><small>지역 ${id+1} · Lv.${level}</small>
      <h3>${name}</h3><p>${description}</p>
      <strong>${progress.claimed?'✓ 탐험 완수':'등불 '+progress.beacons.length+'/3 · 정령 '+Math.min(killGoal,progress.kills)+'/'+killGoal}</strong>
      <p class="career-note">${open?'처치 보상: 베리 '+reward.berries+' · 경험치 '+reward.xp+(reward.multiplier<1?' · 오늘 100마리 이후 25%':''):'레벨 '+level+(id?' · 앞 지역 탐험 완수':'')+'에 열려요.'}</p>
      ${id>=WORLD_TWO_CORE_REGIONS?`<small>첫 완수 보너스 ${bonus.toLocaleString()}베리</small>`:''}
      <button class="career-primary" data-career-action="enter-world2" data-region="${id}" ${open?'':'disabled'}>${progress.claimed?'다시 탐험하기':'탐험 시작'}</button>
    </article>`;
  }).join('');
}
function bossCard(s:Save,region:2|5) {
  const p=s.world2,boss=WORLD_TWO_BOSSES[region],outer=region===5;
  const wins=outer?p.outerBoss.wins:p.bossWins,best=outer?p.outerBoss.bestSeconds:p.bestBossSeconds;
  const pattern=outer?'혜성 돌진 · 성운 고리 · 용의 내려찍기. 체력이 절반 아래면 돌진이 더 잦아져요.':'내려찍기 · 별빛 고리 · 혜성 돌진. 체력이 절반이 되면 2단계가 시작돼요.';
  return `<article class="world-two-boss${outer?' outer-boss':''}"><small>SOLO BOSS · Lv.${boss.level}</small>
    <h3>${boss.name}</h3><p>${pattern} 공격 표시를 보고 피하고, 고리 공격 때는 안쪽으로 들어가요.</p>
    <p>${wins?'승리 '+wins+'회'+(best===null?'':' · 최고 기록 '+Math.ceil(best)+'초'):WORLD_TWO_REGIONS[region].name+' 완수 후 도전할 수 있어요.'}</p>
    <p class="career-note">첫 승리 보너스: ${outer?'':'전설 의상 3종 · '}${boss.firstBerries.toLocaleString()}베리 · 경험치 ${boss.firstXp.toLocaleString()}. 반복 보상은 하루 첫 3회 정상, 이후 25%.</p>
    <button class="career-primary" data-career-action="enter-world2-boss" data-region="${region}" ${canEnterWorldTwo(p,s.level,region,true)?'':'disabled'}>${outer?'성운룡에게 도전':'수호자에게 도전'}</button>
  </article>`;
}
export function renderWorldTwo(s:Save) {
  const collection='<details class="world-two-collection"><summary>세계 2 장비 도감 · 12종</summary><div class="career-supply-list">'+[...WEAPONS.slice(27,36).map((w,i)=>({name:w.name,id:27+i,kind:'weapon' as const,owned:s.weapons[27+i]!==undefined})),...OUTFITS.slice(26,29).map((w,i)=>({name:w.name,id:26+i,kind:'outfit' as const,owned:s.outfits[26+i]!==undefined}))].map(w=>'<article><h4>'+w.name+'</h4><small>'+worldTwoEquipmentSource(w.kind,w.id)+'</small><p>'+(w.owned?'✓ 보유 중':'아직 발견하지 않았어요')+'</p><button data-career-action="world2-equipment" data-kind="'+w.kind+'" data-item="'+w.id+'">미리보기'+(w.owned?' · 장착':'')+'</button></article>').join('')+'</div></details>';
  return `<section class="career-sheet world-two-sheet"><header class="career-heading">
    <small>WORLD 02 · 솔로 탐험</small><h2>${WORLD_TWO_NAME}</h2>
    <p>여섯 지역을 탐험하고 두 보스에게 도전해요. 별등불 3개와 정령 6마리를 찾아 지역을 완수해요.</p>
  </header><nav class="nav-tabs" aria-label="별너머 군도 모험 종류">
    <button class="secondary" aria-pressed="true" data-career-action="open-world2">⚔ 사냥 탐험</button>
    <button class="secondary" data-astral-action="map">📚 심화 수학숲</button>
  </nav><h3 class="world-two-section">안쪽 군도 · 레벨 60–100</h3>
  <div class="world-two-regions">${regionCards(s,0,WORLD_TWO_CORE_REGIONS)}</div>${bossCard(s,2)}
  <h3 class="world-two-section">외곽 군도 · 레벨 120–300</h3>
  <div class="world-two-regions">${regionCards(s,WORLD_TWO_CORE_REGIONS,WORLD_TWO_REGIONS.length)}</div>${bossCard(s,5)}
  ${collection}<p class="career-note">안쪽 군도 무기·의상은 가방과 상점 미리보기에서 장착·강화해요. 진행과 보상은 저장 파일에 담겨요.</p>
  <button class="career-return" data-career-action="close">게임으로 돌아가기</button></section>`;
}
export function worldTwoTask(s:Save) {
  const location=s.world2.location;
  if (!location) return '';
  if (location.boss) return '보스 도전 · 쓰러지면 야영지에서 다시 시작해요.';
  const progress=s.world2.regions[location.region],goal=WORLD_TWO_REGIONS[location.region].killGoal;
  return progress.claimed?'✓ 지역 완수! 군도 지도에서 다음 모험을 골라요.':`등불 ${progress.beacons.length}/3 · 정령 ${Math.min(progress.kills,goal)}/${goal} · 등불 가까이서 E / 대화`;
}
