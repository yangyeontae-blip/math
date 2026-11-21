import {mathQuestionXp,mathLevelBerries} from './rules';

/** 2026-11-21 중앙광장 안내(웹은 연태쌤, 앱은 가명 베리쌤)(Codex 시안: 분수 광장·안내 게시판 배너, 큰 수학숲 카드, 장소 8곳 그림 카드). */
export const PLAZA_GUIDE_PLACES=[
 {id:'academy',icon:'academy',name:'모험학교',where:'광장 위쪽',detail:'직업·스킬 · 10·30·60·100·200레벨 전직'},
 {id:'hunt',icon:'hunt',name:'가시덩굴 숲',where:'왼쪽 위',detail:'무기와 스킬로 사냥 · 음식·물약으로 회복'},
 {id:'world2',icon:'world2',name:'별너머 군도',where:'오른쪽 위',detail:'60~500레벨 지역 · 두 수호자에게 도전'},
 {id:'friends',icon:'friends',name:'친구들과 광장',where:'함께하는 광장',detail:'학년과 관계없이 같은 광장 · 최대 128명'},
 {id:'shops',icon:'shops',name:'상점거리',where:'왼쪽 아래',detail:'의상·미용·펫·탈것·무기·물약 · 물약 공방'},
 {id:'home',icon:'home',name:'나의 집',where:'오른쪽',detail:'내가 꾸민 집과 정원 · 마을 친구들의 방문'},
 {id:'hall',icon:'hall',name:'명예의 전당',where:'공지판 옆 뽀짝이',detail:'레벨 랭킹과 베리 부자'},
 {id:'notice',icon:'notice',name:'운영자 소식',where:'공지판',detail:'새 소식과 업데이트 안내'},
] as const;

export function plazaGuideHtml(o:{base:string;level:number;grade:number;teacher:string;foot:string}){
 const art=o.base+'art/plaza-guide/',level=Math.max(1,Math.min(100000,Math.floor(o.level||1)));
 const places=PLAZA_GUIDE_PLACES.map(p=>'<button class="pg-place" data-nav="'+p.id+'"><img src="'+art+'place-'+p.icon+'.webp" alt="" aria-hidden="true" decoding="async"><span><strong>'+p.name+'</strong><small>'+p.where+'</small><em>'+p.detail+'</em></span></button>').join('');
 return '<section class="sb-paper pg-sheet">'
  +'<header class="sb-hero"><img src="'+art+'hero.webp" alt="" decoding="async"><div class="sb-hero-text"><small>'+o.teacher+'의 안내 게시판</small><h3>어서 와요,<br>베리숲 중앙광장!</h3></div></header>'
  +'<div class="nav-list pg-list">'
  +'<button class="pg-main" data-nav="explore"><img class="pg-main-art" src="'+art+'place-forest.webp" alt="" aria-hidden="true"><span class="pg-main-body"><small>⭐ 우리의 메인 모험</small><strong>수학숲으로 모험하기</strong><em>아래쪽 책과 별이 빛나는 숲 아치로 가 보세요. '+o.grade+'학년 수학을 풀고 숲을 탐험하며 베리와 추억을 모아요.</em><span class="pg-main-chips"><b>🍓 한 판 +'+mathLevelBerries(level).toLocaleString()+'</b><b>✨ 1문제 '+mathQuestionXp(level,12).toLocaleString()+' XP</b></span></span><span class="sb-play" aria-hidden="true"><i></i></span></button>'
  +places+'</div>'
  +'<p class="sb-note pg-foot"><img src="'+art+'pin-note.webp" alt="" aria-hidden="true">'+o.foot+'</p>'
  +'</section>';
}
