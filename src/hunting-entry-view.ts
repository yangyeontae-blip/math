/** 2026-11-21 가시덩굴 숲 사냥터 고르기 화면(Codex 시안: 가시덩굴 배너·방패/칼 리본·사냥터 그림 카드). */
export type HuntZoneChoice={name:string;level:number;berries:number;xp:number;locked:boolean;now?:{berries:number;xp:number;notice:string}};

export function huntingEntryHtml(o:{base:string;level:number;power:number;zones:HuntZoneChoice[]}){
 const art=o.base+'art/hunting-grounds/';
 const cards=o.zones.map((z,i)=>'<button class="sb-card hg-zone" data-career-action="enter-hunting" data-zone="'+i+'" '+(z.locked?'disabled':'')+'>'
  +'<img class="sb-emblem" src="'+art+'zone-'+i+'.webp" alt="" aria-hidden="true" decoding="async">'
  +'<span class="sb-card-body"><strong>'+z.name+'</strong>'
  +'<small><span class="sb-strong">권장 레벨 '+z.level+'</span> · 기본 베리 '+z.berries+' · 경험치 '+z.xp+'</small>'
  +'<small><img src="'+art+'icon-berry.webp" alt="" aria-hidden="true">'+(z.locked||!z.now?'권장 레벨부터 입장해요.':'지금 받을 보상: 베리 '+z.now.berries+' · 경험치 '+z.now.xp+z.now.notice)+'</small></span>'
  +(z.locked?'<span class="sb-play is-locked" aria-hidden="true"><img src="'+art+'icon-lock.webp" alt=""></span>':'<span class="sb-play" aria-hidden="true"><i></i></span>')+'</button>').join('');
 return '<section class="career-sheet sb-paper hg-sheet">'
  +'<img class="sb-vine left" src="'+o.base+'art/math-forest/vine-corner.webp" alt="" aria-hidden="true"><img class="sb-vine right" src="'+o.base+'art/math-forest/vine-corner.webp" alt="" aria-hidden="true">'
  +'<header class="sb-hero"><img src="'+art+'hero.webp" alt="" decoding="async"><div class="sb-hero-text"><small>왼쪽 위 숲길</small><h2>가시덩굴 숲</h2><p>공격 표시를 보고 피하면서 사냥해요.<br>쓰러져도 가진 것은 잃지 않아요.</p></div></header>'
  +'<div class="sb-ribbon"><img src="'+art+'ribbon.webp" alt="" aria-hidden="true"><span class="sb-chip"><img src="'+art+'icon-shield.webp" alt="">레벨 '+o.level.toLocaleString()+'</span><span class="sb-chip"><img src="'+art+'icon-sword.webp" alt="">공격력 '+Math.round(o.power).toLocaleString()+'</span></div>'
  +'<p class="sb-note career-notice">레벨 '+o.level+' · 현재 사냥 공격력 '+Math.round(o.power).toLocaleString()+'<br>레벨이 오르면 기본 공격과 모든 공격 스킬이 함께 강해져요. 구역마다 하루 첫 <b>100마리</b>는 온전한 보상, 그 뒤에는 25%예요. 수학숲 정답 베리는 줄지 않아요.</p>'
  +'<div class="sb-cards">'+cards+'</div>'
  +'<button class="sb-back" data-career-action="close">게임으로 돌아가기</button></section>';
}
