import {huntingSupply,type SupplyUseResult} from './hunt-supplies';
import {skillInfo,isSkill,type SkillId,type JobId} from './academy';

export const HUNT_CAMP={x:0,z:10} as const;
export const HUNT_CAMP_RADIUS=3;
/** 기본 공격의 광역 범위와 주변 몬스터가 받는 피해 비율. */
export const HUNT_SPLASH_RADIUS=3.2,HUNT_SPLASH_SHARE=.6;
export const HUNT_ZONES=[
 {id:0,name:'새싹 사냥터',level:1,hp:48,damage:7,berries:20,xp:12},
 {id:1,name:'햇살 사냥터',level:10,hp:70,damage:10,berries:50,xp:30},
 {id:2,name:'달빛 사냥터',level:30,hp:125,damage:15,berries:100,xp:60},
 {id:3,name:'별빛 사냥터',level:60,hp:200,damage:21,berries:200,xp:120},
] as const;
export const HUNTING_ZONES=HUNT_ZONES;
export type HuntPoint={x:number;z:number};
export type PracticeMode='single'|'multi'|'attacking';
export type HuntEnemy={id:string;type:'melee'|'charge'|'ranged';x:number;z:number;hp:number;maxHp:number;state:'idle'|'telegraph'|'recovery'|'rooted'|'defeated';telegraph?:{x:number;z:number;radius:number;remaining:number};respawnIn:number};
export type HuntEffect={id:string;skill:SkillId;x:number;z:number;radius:number;remaining:number;duration:number};
export type HuntDefeatEvent={type:'defeat';id:string;enemyId:string;enemyType:'melee'|'charge'|'ranged';zone:number;practice:boolean};
export type HuntEvent=HuntDefeatEvent|{type:'hit';enemyId:string;damage:number;skill:SkillId|'basic'}|{type:'playerHit';damage:number;hp:number}|{type:'retreat';x:number;z:number}|{type:'cast';skill:SkillId}|{type:'respawn';enemyId:string}|{type:'practiceEffect';skill:SkillId;kind:'block'|'root'|'escape'|'reveal'|'hit';enemyIds?:string[]};
export type HuntingOptions={zone:number;level:number;power:number;job?:JobId|null;learned?:readonly SkillId[];loadout?:readonly(SkillId|null)[];practice?:boolean;practiceMode?:PracticeMode;maxHpMultiplier?:number;damageReduction?:number};
export type HuntSnapshot={time:number;zone:number;playerHp:number;maxHp:number;invulnerable:number;enemies:HuntEnemy[];cooldowns:Partial<Record<SkillId,number>>;effects:HuntEffect[];speedMultiplier:number;supplies:{food:number;health:number;mealRemaining:number}};
type EnemyRuntime=HuntEnemy&{spawn:HuntPoint;ready:number;rootUntil:number};
type Area=HuntEffect&{damage:number;root:number;trigger:boolean;hit:boolean};
let runtimeSerial=0;
const distance=(a:HuntPoint,b:HuntPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
const finitePoint=(p:HuntPoint)=>Number.isFinite(p.x)&&Number.isFinite(p.z);
const validCompanionOptions=(p:Pick<HuntingOptions,'maxHpMultiplier'|'damageReduction'>)=>(p.maxHpMultiplier===undefined||Number.isFinite(p.maxHpMultiplier)&&p.maxHpMultiplier>0&&p.maxHpMultiplier<=10)&&(p.damageReduction===undefined||Number.isFinite(p.damageReduction)&&p.damageReduction>=0&&p.damageReduction<=1);
const direction=(p?:HuntPoint)=>{const len=p?Math.hypot(p.x,p.z):0;return len&&Number.isFinite(len)?{x:p!.x/len,z:p!.z/len}:{x:0,z:-1};};
/** A separate simulation: no DOM, learning, storage, wall clock, or online writes. */
export class HuntingRuntime{
 private supplyReady={food:0,health:0};private meal:{remaining:number;rate:number}|null=null;
 private time=0;private hp:number;private maxHp:number;private invincibleUntil=0;private nextAttack=0;private cooldowns:Partial<Record<SkillId,number>>={};private buffs:Partial<Record<SkillId,number>>={};private enemies:EnemyRuntime[]=[];private effects:Area[]=[];private serial=0;private readonly session:string;private windStart:HuntPoint|null=null;
 constructor(private readonly options:HuntingOptions){
  if(!Number.isInteger(options.zone)||options.zone<0||options.zone>3||!Number.isFinite(options.level)||options.level<1||!Number.isFinite(options.power)||options.power<=0||!validCompanionOptions(options)||!options.practice&&options.level<HUNT_ZONES[options.zone].level)throw Error('아직 갈 수 없는 사냥터예요.');
  this.maxHp=this.profileMaxHp(options);this.hp=this.maxHp;
  this.session=`hunt-${globalThis.crypto?.randomUUID?.()??++runtimeSerial}`;
  this.reset();
 }
 private profileMaxHp(profile:HuntingOptions){return Math.floor((100+Math.min(500,Math.floor(profile.level*2)))*(profile.practice?1:profile.maxHpMultiplier??1));}
 updateProfile(profile:Pick<HuntingOptions,'level'|'power'>&Partial<Pick<HuntingOptions,'job'|'learned'|'loadout'|'maxHpMultiplier'|'damageReduction'>>){if(!Number.isFinite(profile.level)||profile.level<1||!Number.isFinite(profile.power)||profile.power<=0||!validCompanionOptions(profile))return false;const maxHp=this.profileMaxHp({...this.options,...profile});this.hp=Math.min(maxHp,this.hp+Math.max(0,maxHp-this.maxHp));this.maxHp=maxHp;Object.assign(this.options,profile);return true;}
 reset(){this.supplyReady={food:0,health:0};this.meal=null;this.time=0;this.hp=this.maxHp;this.invincibleUntil=0;this.nextAttack=0;this.cooldowns={};this.buffs={};this.effects=[];this.windStart=null;const positions=[[-6,-3],[0,-6],[6,-3],[-8,-10],[0,-13],[8,-10]];
  const count=this.options.practice?(this.options.practiceMode==='multi'?3:this.options.practiceMode==='attacking'?2:1):6;
  this.enemies=positions.slice(0,count).map(([x,z],i)=>({id:String(i),type:(['melee','charge','ranged'] as const)[i%3],x:this.options.practice?i*3-((count-1)*1.5):x,z:this.options.practice?0:z,hp:HUNT_ZONES[this.options.zone].hp,maxHp:HUNT_ZONES[this.options.zone].hp,state:'idle',respawnIn:0,ready:0,rootUntil:0,spawn:{x:this.options.practice?i*3-((count-1)*1.5):x,z:this.options.practice?0:z}}));
 }
 snapshot():HuntSnapshot{return {time:this.time,zone:this.options.zone,playerHp:this.hp,maxHp:this.maxHp,invulnerable:Math.max(0,this.invincibleUntil-this.time),enemies:this.enemies.map(({spawn,ready,rootUntil,...e})=>structuredClone(e)),cooldowns:Object.fromEntries(Object.entries(this.cooldowns).map(([k,v])=>[k,Math.max(0,v!-this.time)])),effects:this.effects.map(({damage,root,trigger,hit,...e})=>({...e})),speedMultiplier:this.active('wind')?1.6:1,supplies:{food:Math.max(0,this.supplyReady.food-this.time),health:Math.max(0,this.supplyReady.health-this.time),mealRemaining:this.meal?.remaining??0}};}
 private active(id:SkillId){return (this.buffs[id]??0)>this.time;}
 private targets(player:HuntPoint,range:number,facing?:HuntPoint){const forward=facing?direction(facing):null;return this.enemies.filter(e=>e.hp>0&&distance(e,player)<=range&&(!forward||(e.x-player.x)*forward.x+(e.z-player.z)*forward.z>=0)).sort((a,b)=>distance(a,player)-distance(b,player));}
 consumeSupply(id:number):SupplyUseResult{
  const item=huntingSupply(id);if(!item)return {used:false,reason:'invalid'};
  if(this.options.practice)return {used:false,reason:'practice'};
  if(this.hp>=this.maxHp)return {used:false,reason:'full'};
  if(this.supplyReady[item.kind]>this.time+1e-8)return {used:false,reason:'cooldown'};
  this.supplyReady[item.kind]=this.time+item.cooldownSeconds;
  if(item.kind==='food'){this.meal={remaining:item.durationSeconds,rate:this.maxHp*item.fraction/item.durationSeconds};return {used:true,healed:0};}
  const healed=Math.min(this.maxHp-this.hp,Math.round(this.maxHp*item.fraction));this.hp+=healed;return {used:true,healed};
 }
 private hurt(e:EnemyRuntime,power:number,skill:SkillId|'basic',events:HuntEvent[],precise=false){if(e.hp<=0||!Number.isFinite(power)||power<=0)return;const damage=Math.min(e.hp,precise?power:Math.max(1,Math.round(power)));e.hp=Math.max(0,e.hp-damage);events.push({type:'hit',enemyId:e.id,damage,skill});if(this.options.practice){if(skill!=='basic')events.push({type:'practiceEffect',skill,kind:'hit',enemyIds:[e.id]});else if(this.active('guardian'))events.push({type:'practiceEffect',skill:'guardian',kind:'hit',enemyIds:[e.id]});}if(e.hp<=1e-8){e.hp=0;e.state='defeated';e.respawnIn=12;e.telegraph=undefined;events.push({type:'defeat',id:`${this.session}:${++this.serial}`,enemyId:e.id,enemyType:e.type,zone:this.options.zone,practice:!!this.options.practice});}}
 // 기본 공격: 아이가 고른(화면이 바라보는) 몬스터를 그대로 때려요. 예전에는 매번 가장 가까운 몬스터로 바뀌어 피해가 흩어졌어요.
 // 광역: 맞은 몬스터 둘레 3.2칸 안의 다른 몬스터도 60% 피해를 받아요.
 attack(player:HuntPoint,facing?:HuntPoint,targetId?:string|null):HuntEvent[]{const events:HuntEvent[]=[];if(!finitePoint(player)||this.time<this.nextAttack||!this.options.practice&&distance(player,HUNT_CAMP)<HUNT_CAMP_RADIUS)return events;const range=this.options.job==='ranger'?10:this.options.job==='mage'?8:2.8;const chosen=targetId?this.enemies.find(e=>e.id===targetId&&e.hp>0&&distance(e,player)<=range):undefined;const e=chosen??this.targets(player,range,facing)[0];if(!e)return events;this.nextAttack=this.time+.85;const power=this.options.power*(this.active('guardian')?1.3:1),splash=this.enemies.filter(o=>o!==e&&o.hp>0&&distance(o,e)<=HUNT_SPLASH_RADIUS);this.hurt(e,power,'basic',events);for(const o of splash)this.hurt(o,power*HUNT_SPLASH_SHARE,'basic',events);return events;}
 cast(id:SkillId,player:HuntPoint,facing?:HuntPoint):HuntEvent[]{const events:HuntEvent[]=[];
  if(!isSkill(id)||!finitePoint(player)||(this.cooldowns[id]??0)>this.time)return events;
  const skill=skillInfo(id);if(!this.options.learned?.includes(id)||skill.job&&this.options.job!==skill.job||this.options.loadout&&!this.options.loadout.includes(id))return events;
  if(skill.job&&!this.options.practice&&distance(player,HUNT_CAMP)<HUNT_CAMP_RADIUS)return events;
  if(['acornRush','vinePull','dawnSlash','leafOrb','thunderChain','comet','tripleShot','galeShot','moonArrow'].includes(id)){
   const range=id==='moonArrow'?14:id==='vinePull'?8:id==='dawnSlash'?7:id==='acornRush'?5:12;
   const directional=['acornRush','dawnSlash','leafOrb','tripleShot','moonArrow'].includes(id),area=id==='comet'||id==='galeShot';
   let targets=this.targets(player,range,directional?facing:undefined);
   const primary=targets[0];if(!primary)return events;
   if(area)targets=this.targets(primary,id==='comet'?6:5);
   else targets=targets.slice(0,id==='moonArrow'?1:id==='thunderChain'?4:['vinePull','leafOrb','tripleShot'].includes(id)?3:6);
   this.cooldowns[id]=this.time+skill.cooldown;events.push({type:'cast',skill:id});
   this.addEffect(id,primary,area?(id==='comet'?6:5):id==='dawnSlash'?7:id==='acornRush'?5:1,skill.duration,0,0,false);
   for(const enemy of targets){
    if(id==='acornRush')for(let hit=0;hit<3;hit++)this.hurt(enemy,this.options.power*skill.power/3,id,events,true);
    else this.hurt(enemy,this.options.power*skill.power,id,events);
    if(enemy.hp<=0)continue;
    const root=id==='vinePull'?1.5:id==='thunderChain'||id==='galeShot'?1:0;
    if(id==='vinePull'){const d=distance(enemy,player);if(d>1.8){const factor=1.8/d;enemy.x=Math.max(-16,Math.min(16,player.x+(enemy.x-player.x)*factor));enemy.z=Math.max(-18,Math.min(5,player.z+(enemy.z-player.z)*factor));}}
    if(root){enemy.rootUntil=this.time+root;enemy.state='rooted';enemy.telegraph=undefined;if(this.options.practice)events.push({type:'practiceEffect',skill:id,kind:'root',enemyIds:[enemy.id]});}
   }
   return events;
  }
  const aim=direction(facing),needsLine=id==='pierce';
  const areaSkill=['vortex','starfall','storm'].includes(id);
  const areaTarget=areaSkill?(this.targets(player,12,facing)[0]??this.targets(player,12)[0]):undefined;
  if(areaSkill&&!areaTarget)return events;
  if(skill.job&&id!=='guardian'&&!areaSkill&&!this.targets(player,id==='trap'?14:['starbolt','arrow','pierce'].includes(id)?12:id==='charge'?7:5,['starbolt','arrow','pierce','crescent','charge'].includes(id)?facing:undefined).some(e=>!needsLine||Math.abs((e.x-player.x)*aim.z-(e.z-player.z)*aim.x)<1.5))return events;
  this.cooldowns[id]=this.time+skill.cooldown;events.push({type:'cast',skill:id});
  if(['shield','wind','lantern','guardian'].includes(id)){this.buffs[id]=this.time+skill.duration;this.addEffect(id,player,2,skill.duration,0,0,false);if(id==='wind')this.windStart={...player};if(this.options.practice&&id==='lantern'&&this.targets(player,14).length)events.push({type:'practiceEffect',skill:id,kind:'reveal'});return events;}
  const forward=direction(facing),ranged=['starbolt','arrow','pierce'].includes(id),range=ranged?12:id==='charge'?7:5;
  if(areaTarget){this.addEffect(id,areaTarget,6,skill.duration,this.options.power*skill.power,0,false);return events;}
  if(id==='trap'){this.addEffect(id,{x:player.x+forward.x*3,z:player.z+forward.z*3},3,12,this.options.power,3,true);return events;}
  const targets=this.targets(player,range,ranged||id==='crescent'||id==='charge'?facing:undefined).filter(e=>id!=='pierce'||Math.abs((e.x-player.x)*forward.z-(e.z-player.z)*forward.x)<1.5).slice(0,id==='pierce'?3:ranged||id==='charge'?1:6);
  this.addEffect(id,targets[0]??player,ranged?1:4,skill.duration,0,0,false);
  for(const e of targets){this.hurt(e,this.options.power*skill.power,id,events);if(e.hp>0&&['roots','frost'].includes(id)){e.rootUntil=this.time+2;e.state='rooted';e.telegraph=undefined;if(this.options.practice)events.push({type:'practiceEffect',skill:id,kind:'root',enemyIds:[e.id]});}if(id==='charge'&&e.hp>0){e.x=Math.max(-16,Math.min(16,e.x+forward.x*2));e.z=Math.max(-18,Math.min(5,e.z+forward.z*2));}}
  return events;
 }
 private addEffect(skill:SkillId,p:HuntPoint,radius:number,duration:number,damage:number,root:number,trigger:boolean){this.effects.push({id:`effect-${++this.serial}`,skill,x:p.x,z:p.z,radius,duration,remaining:duration,damage,root,trigger,hit:false});}
 step(dt:number,player:HuntPoint,paused=false):HuntEvent[]{const events:HuntEvent[]=[];if(paused||!Number.isFinite(dt)||dt<=0||!finitePoint(player))return events;let remaining=Math.min(dt,5);while(remaining>1e-8){const part=Math.min(.05,remaining);remaining-=part;this.tick(part,player,events);}return events;}
 private tick(dt:number,player:HuntPoint,events:HuntEvent[]){this.time+=dt;if(this.meal){const elapsed=Math.min(dt,this.meal.remaining);this.hp=Math.min(this.maxHp,this.hp+this.meal.rate*elapsed);this.meal.remaining-=elapsed;if(this.meal.remaining<1e-8)this.meal=null;}const safe=!this.options.practice&&distance(player,HUNT_CAMP)<HUNT_CAMP_RADIUS;
  if(this.options.practice&&this.windStart&&this.active('wind')&&distance(player,this.windStart)>=3){events.push({type:'practiceEffect',skill:'wind',kind:'escape'});this.windStart=null;}
  if(safe)this.hp=Math.min(this.maxHp,this.hp+this.maxHp*.25*dt);
  for(const a of this.effects){const elapsed=Math.min(dt,a.remaining);a.remaining-=elapsed;if(!a.damage||safe)continue;
   const targets=this.targets(a,a.radius);
   if(a.trigger){if(a.hit||!targets.length)continue;a.hit=true;a.remaining=3;for(const e of targets){this.hurt(e,a.damage,a.skill,events);if(e.hp>0){e.rootUntil=this.time+a.root;e.state='rooted';e.telegraph=undefined;if(this.options.practice)events.push({type:'practiceEffect',skill:a.skill,kind:'root',enemyIds:[e.id]});}}}
   else for(const e of targets)this.hurt(e,a.damage*elapsed/a.duration,a.skill,events,true);
  }
  this.effects=this.effects.filter(a=>a.remaining>0);
  for(const e of this.enemies){
   if(e.hp<=0){e.respawnIn=Math.max(0,e.respawnIn-dt);if(e.respawnIn<=1e-8&&distance(player,e.spawn)>=3){e.hp=e.maxHp;e.x=e.spawn.x;e.z=e.spawn.z;e.state='idle';e.ready=this.time+1;events.push({type:'respawn',enemyId:e.id});}continue;}
   if(e.rootUntil>this.time){e.state='rooted';continue;}if(e.state==='rooted')e.state='idle';
   if(safe||!this.options.practice&&(distance(e,player)>16||distance(e,e.spawn)>12)){e.telegraph=undefined;e.state='idle';const d=distance(e,e.spawn);if(d>.05){const move=Math.min(3*dt,d);e.x+=(e.spawn.x-e.x)/d*move;e.z+=(e.spawn.z-e.z)/d*move;}else{e.x=e.spawn.x;e.z=e.spawn.z;e.hp=e.maxHp;}continue;}
   if(this.options.practice&&this.options.practiceMode!=='attacking'){e.telegraph=undefined;e.state='idle';continue;}
   if(e.telegraph){e.telegraph.remaining-=dt;if(e.telegraph.remaining<=0){if(distance(player,e.telegraph)<=e.telegraph.radius&&this.time>=this.invincibleUntil){const reduction=Math.min(this.active('shield')?.5:1,this.active('guardian')?.6:1,this.options.practice?1:1-(this.options.damageReduction??0));const damage=Math.max(1,Math.round(HUNT_ZONES[this.options.zone].damage*reduction));this.hp=Math.max(0,this.hp-damage);events.push({type:'playerHit',damage,hp:this.hp});if(this.options.practice)for(const skill of ['shield','guardian'] as const)if(this.active(skill))events.push({type:'practiceEffect',skill,kind:'block'});this.invincibleUntil=this.time+.5;
      if(this.hp===0){this.meal=null;this.hp=this.maxHp;this.invincibleUntil=this.time+3;this.effects=[];events.push({type:'retreat',...HUNT_CAMP});for(const enemy of this.enemies){enemy.telegraph=undefined;enemy.ready=this.time+3;enemy.x=enemy.spawn.x;enemy.z=enemy.spawn.z;enemy.state=enemy.hp>0?'idle':'defeated';}return;}}
     if(e.type==='charge'){e.x=e.telegraph.x;e.z=e.telegraph.z;}e.telegraph=undefined;e.state='recovery';e.ready=this.time+1.5;}continue;}
   if(e.ready>this.time)continue;e.state='idle';const d=distance(e,player),range=e.type==='ranged'?10:e.type==='charge'?6:2;
   if(d<=range){const duration=e.type==='melee'?.9:1.2;e.telegraph={x:player.x,z:player.z,radius:e.type==='melee'?1.8:e.type==='charge'?2:1.5,remaining:duration};e.state='telegraph';}
   else if(d<14&&!this.options.practice){const move=Math.min((e.type==='charge'?1.8:1.4)*dt,d-range);e.x+=(player.x-e.x)/d*move;e.z+=(player.z-e.z)/d*move;}
  }
 }
}
