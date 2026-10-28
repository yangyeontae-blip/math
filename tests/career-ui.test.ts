import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSkillIcon, renderCareerSchool, renderCombatHud, type CareerSchoolView } from '../src/career-ui';

const original=['shield','wind','lantern','crescent','charge','roots','guardian','starbolt','frost','vortex','starfall','arrow','pierce','trap','storm'];
const added=['acornRush','vinePull','dawnSlash','leafOrb','thunderChain','comet','tripleShot','galeShot','moonArrow'];

test('new job skills each have a distinct vector sigil and never reuse a painted atlas cell',()=>{
 const drawings=new Set<string>();
 for(const [index,id] of added.entries()){
  for(const suppliedIndex of [index,15+index,100]){
   const html=renderSkillIcon(id,suppliedIndex);
   assert.match(html,/career-sigil is-vector/);
   assert.doesNotMatch(html,/career-painted-sigil|--sigil-[xy]/);
   assert.match(html,/viewBox="0 0 48 48"/);
   drawings.add(html.match(/<svg[^>]*>(.*?)<\/svg>/)![1]);
  }
 }
 assert.equal(drawings.size,9);
});

test('the fifteen existing painted sigils keep their original cells after skill list reordering',()=>{
 for(const [cell,id] of original.entries()){
  const html=renderSkillIcon(id,cell+9);
  assert.match(html,/career-painted-sigil/);
  assert.ok(html.includes(`--sigil-x:${cell%5*25}%;--sigil-y:${Math.floor(cell/5)*50}%`),id);
 }
 assert.equal(renderSkillIcon('knight',99).match(/<svg[^>]*>(.*?)<\/svg>/)![1],renderSkillIcon('crescent',3).match(/<svg[^>]*>(.*?)<\/svg>/)![1]);
 assert.doesNotMatch(renderSkillIcon('unknown',15),/career-painted-sigil/);
});

test('all twenty four skills remain available to school rendering while combat keeps four slots',()=>{
 const skills=[...original,...added].map((id,iconIndex)=>({id,name:id,description:'숲의 기술',iconIndex,unlocked:true}));
 const vm:CareerSchoolView={level:60,job:'knight',rank:3,jobs:[],skills,slots:['acornRush','leafOrb','galeShot','moonArrow']};
 const school=renderCareerSchool(vm);
 assert.equal((school.match(/<article class="career-skill-card/g)||[]).length,24);
 const hud=renderCombatHud({hp:80,maxHp:100,skills:vm.slots.map(id=>skills.find(s=>s.id===id)!)});
 assert.equal((hud.match(/data-career-action="cast-skill"/g)||[]).length,4);
 assert.equal((hud.match(/career-sigil is-vector/g)||[]).length,4);
 for(const id of vm.slots)assert.ok(hud.includes(`data-cast-skill="${id}"`));
 assert.equal((school.match(/data-career-action="select-slot"/g)||[]).length,4);
});

test('skill labels and identifiers are escaped without injecting markup',()=>{
 const html=renderSkillIcon('" onpointerdown="bad',99,'<script>bad</script>');
 assert.doesNotMatch(html,/<script>| onpointerdown="bad/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(renderSkillIcon('constructor',NaN),/career-painted-sigil/);
});
