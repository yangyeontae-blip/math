import {mathQuestionXp,mathLevelBerries} from './rules';
import {WORKSHOP_MAX_ORBS} from './potion-workshop';

/** 2026-11-21 수학숲 입구: Codex 수채화 배너와 종이 카드로 꾸민 숲 고르기 화면(지브리풍 분위기, 오리지널 그림). */
export type ForestChoice={id:string;icon:string;name:string;open:number;found:number};
export const MATH_FOREST_HERO='art/math-forest/hero.webp';
const SYMBOL:Record<string,string>={addition:'+',subtraction:'−',multiplication:'×',division:'÷'};

function safeLevel(level:number){return Math.max(1,Math.min(100000,Math.floor(Number.isFinite(level)?level:1)));}
const clampStage=(n:number)=>Math.max(0,Math.min(10,Math.floor(Number.isFinite(n)?n:0)));

export function mathForestEntryHtml(o:{level:number;grade:number;forests:ForestChoice[];links:string;base:string}){
 const level=safeLevel(o.level),xp=mathQuestionXp(level,12),berries=mathLevelBerries(level);
 const forests=o.forests.map(f=>{const open=clampStage(f.open),found=clampStage(f.found);
  return '<button class="mf-forest mf-'+f.id+'" data-nav="'+f.id+'"><span class="mf-emblem" aria-hidden="true"><b>'+(SYMBOL[f.id]??f.icon)+'</b></span>'
   +'<span class="mf-forest-body"><strong>'+f.name+'</strong><span class="mf-steps" role="img" aria-label="열린 단계 '+open+' / 10">'+Array.from({length:10},(_,i)=>'<i'+(i<open?' class="on"':'')+'></i>').join('')+'</span>'
   +'<small>🌱 열린 단계 '+open+'/10 · 발견 '+found+'/10</small></span><span class="mf-play" aria-hidden="true">▶</span></button>';}).join('');
 return '<div class="mf-entry">'
  +'<section class="mf-hero"><img class="mf-hero-img" src="'+o.base+MATH_FOREST_HERO+'" alt="" decoding="async"><div class="mf-hero-text"><small>'+o.grade+'학년 수학숲 · Lv. '+level.toLocaleString()+'</small><h3>오늘은 어느 숲으로<br>갈까요?</h3><p>숲을 고르고 열린 단계를 탐험해요.<br>발자국 끝의 장소를 되살리면 추억과 도안이 쌓여요.</p></div></section>'
  +'<section class="math-reward-notice mf-ribbon" aria-label="수학 보상 안내"><div class="mf-ribbon-band"><span class="mf-chip berry">🍓 한 판 +'+berries.toLocaleString()+'베리</span><span class="mf-chip xp">✦ 1문제 '+xp.toLocaleString()+' XP</span><span class="mf-chip orb">⚗️ 지혜 구슬 +1</span></div><p class="mf-fine">학년과 난도에 맞는 문제를 힌트 없이 처음 맞혔을 때의 기본 안내예요. 지혜 구슬은 최대 '+WORKSHOP_MAX_ORBS+'개까지 모여요. 장비·문제 종류에 따라 달라지고, 힌트로 배우거나 틀려도 가진 것은 줄지 않아요.</p></section>'
  +'<div class="nav-list mf-forests">'+forests+'</div>'
  +'<div class="nav-links mf-links">'+o.links+'</div>'
  +'</div>';
}
