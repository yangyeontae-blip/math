import {mathQuestionXp,mathLevelBerries} from './rules';
import {WORKSHOP_MAX_ORBS} from './potion-workshop';

/** 2026-11-21 수학숲 입구: Codex 시안(수채화 배너·양피지·리본·숲 문장)을 그대로 따라 만든 숲 고르기 화면. 그림은 모두 오리지널이에요. */
export type ForestChoice={id:string;icon:string;name:string;open:number;found:number};
export const MATH_FOREST_ART='art/math-forest/';
const SYMBOL:Record<string,string>={addition:'+',subtraction:'−',multiplication:'×',division:'÷'};

function safeLevel(level:number){return Math.max(1,Math.min(100000,Math.floor(Number.isFinite(level)?level:1)));}
const clampStage=(n:number)=>Math.max(0,Math.min(10,Math.floor(Number.isFinite(n)?n:0)));

export function mathForestEntryHtml(o:{level:number;grade:number;forests:ForestChoice[];links:string;base:string}){
 const level=safeLevel(o.level),xp=mathQuestionXp(level,12),berries=mathLevelBerries(level),art=o.base+MATH_FOREST_ART;
 const forests=o.forests.map(f=>{const open=clampStage(f.open),found=clampStage(f.found),emblem=SYMBOL[f.id]?'<img src="'+art+'emblem-'+f.id+'.webp" alt="" decoding="async">':'<b>'+f.icon+'</b>';
  return '<button class="mf-forest mf-'+f.id+'" data-nav="'+f.id+'"><span class="mf-emblem" aria-hidden="true">'+emblem+'</span>'
   +'<span class="mf-forest-body"><strong>'+f.name+'</strong><span class="mf-steps-row"><span class="mf-steps" role="img" aria-label="열린 단계 '+open+' / 10">'+Array.from({length:10},(_,i)=>'<i'+(i<open?' class="on"':'')+'></i>').join('')+'</span><em>'+open+'/10</em></span>'
   +'<small><img src="'+art+'icon-leaf.webp" alt="" aria-hidden="true">발견 '+found+'/10</small></span><span class="mf-play" aria-hidden="true"><i></i></span></button>';}).join('');
 return '<div class="mf-entry" style="--mf-art:url(\''+art+'parchment.webp\')">'
  +'<img class="mf-vine left" src="'+art+'vine-corner.webp" alt="" aria-hidden="true"><img class="mf-vine right" src="'+art+'vine-corner.webp" alt="" aria-hidden="true">'
  +'<section class="mf-hero"><img class="mf-hero-img" src="'+art+'hero.webp" alt="" decoding="async"><div class="mf-hero-text"><small>'+o.grade+'학년 수학숲 · Lv. '+level.toLocaleString()+'</small><h3>오늘은 어느 숲으로<br>갈까요?</h3></div></section>'
  +'<section class="math-reward-notice mf-ribbon" aria-label="수학 보상 안내"><div class="mf-ribbon-band"><img class="mf-ribbon-art" src="'+art+'ribbon.webp" alt="" aria-hidden="true"><span class="mf-chip berry">🍓 한 판 +'+berries.toLocaleString()+'</span><span class="mf-chip xp">✨ 1문제 '+xp.toLocaleString()+' XP</span><span class="mf-chip orb">⚗️ 구슬 +1</span></div><p class="mf-fine">숲을 고르고 열린 단계를 탐험해요. 학년과 난도에 맞는 문제를 힌트 없이 처음 맞혔을 때의 보상이에요. 지혜 구슬은 '+WORKSHOP_MAX_ORBS+'개까지 모여요. 힌트로 배우거나 틀려도 가진 것은 줄지 않아요.</p></section>'
  +'<div class="nav-list mf-forests">'+forests+'</div>'
  +'<div class="nav-links mf-links">'+o.links+'</div>'
  +'</div>';
}
