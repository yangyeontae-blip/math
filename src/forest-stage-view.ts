/** 2026-11-21 수학숲 안쪽 「단계와 발견」(Codex 시안: 숲길을 따라 아래에서 위로 오르는 10단계 메달 지도). */
export type ForestStageChoice={step:number;name:string;range:string;open:boolean;cleared:boolean;met:number;total:number};

export function forestStageHtml(o:{base:string;title:string;intro:string;stages:ForestStageChoice[]}){
 const art=o.base+'art/forest-stages/';
 const current=o.stages.find(s=>s.open&&!s.cleared)?.step??o.stages.filter(s=>s.open).at(-1)?.step??1;
 const nodes=o.stages.map((s,i)=>{const side=i%2?'right':'left',state=s.cleared?'cleared':s.open?(s.step===current?'current':'open'):'locked';
  const status=s.open?s.cleared?'통과 완료 · 다시 탐험':s.met+' / '+s.total+' 친구와 만나기':'앞 단계를 통과하면 열려요';
  return '<li class="fs-node is-'+side+' is-'+state+'"><button class="stage-card fs-stage'+(s.cleared?' cleared':'')+'" data-stage="'+s.step+'" '+(s.open?'':'disabled')+' aria-label="'+s.step+'단계 '+s.name+' · '+status+'">'
   +'<span class="fs-medal"><img src="'+art+'stage-'+s.step+'.webp" alt="" aria-hidden="true" decoding="async"><b class="fs-num">'+s.step+'</b>'
   +(s.cleared?'<img class="fs-badge" src="'+art+'check.webp" alt="" aria-hidden="true">':s.open?'':'<img class="fs-badge" src="'+art+'lock.webp" alt="" aria-hidden="true">')+'</span>'
   +'<span class="fs-label"><strong>'+s.name+'</strong><small>'+s.range+'</small><em>'+status+'</em></span></button></li>';}).join('');
 return '<section class="sb-paper fs-sheet">'
  +'<header class="sb-hero"><img src="'+art+'hero.webp" alt="" decoding="async"><div class="sb-hero-text"><small>단계와 발견</small><h3>'+o.title+'</h3></div></header>'
  +'<nav class="fs-tools"><button id="forest-back" class="fs-round" aria-label="수학 모험 지도로 돌아가기">←</button><button id="forest-discoveries" class="sb-chip"><img src="'+o.base+'art/math-forest/icon-leaf.webp" alt="">발견 장소</button><button id="forest-story" class="sb-chip"><img src="'+o.base+'art/math-forest/icon-bag.webp" alt="">이야기 의뢰</button></nav>'
  +'<p class="sb-note fs-intro">'+o.intro+' 한 단계의 몬스터를 모두 만나면 다음 길이 열려요.</p>'
  +'<ol class="fs-trail" data-current="'+current+'">'+nodes+'</ol>'
  +'<button id="forest-village" class="sb-back fs-village">중앙 광장으로 돌아가기</button></section>';
}
