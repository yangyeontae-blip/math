import {operatorAccess} from './operator-access';
import type {Save} from './rules';
import {potionEffects,PPOJJAK_PET_ID} from './rules';
import {todayKey} from './daily';
import {WORLD_TWO_REGIONS,WORLD_TWO_BEACONS,WORLD_TWO_CORE_REGIONS,canEnterWorldTwo,worldTwoRegionReady,worldTwoBoss,emptyWorldTwoDaily} from './world-two';
import type {HuntDefeatEvent} from './hunting';
const claims=new WeakMap<Save,Set<string>>();
function award(s:Save,berries:number,xp:number){s.berries=Math.min(1e9,s.berries+berries);s.xp+=xp;s.world2.totalBerries=Math.min(1e9,s.world2.totalBerries+berries);s.world2.totalXp=Math.min(1e9,s.world2.totalXp+xp);let levels=0;while(s.level<100000&&s.xp>=s.level*40){s.xp-=s.level*40;s.level++;levels++;s.berries=Math.min(1e9,s.berries+20+({30:30000,50:50000,100:100000}[s.level]??0));}if(s.level===100000)s.xp=Math.min(s.xp,s.level*40-1);return levels;}
export function claimWorldTwoRegion(s:Save,id:number){const r=s.world2.regions[id];if(!r||r.claimed||!worldTwoRegionReady(s.world2,id))return [] as number[];r.claimed=true;const granted=[] as number[];for(let i=0;id<WORLD_TWO_CORE_REGIONS&&i<3;i++){const weapon=27+id*3+i;if(s.weapons[weapon]===undefined){s.weapons[weapon]=0;granted.push(weapon);}}award(s,WORLD_TWO_REGIONS[id].bonus,1000+id*500);return granted;}
export function activateWorldTwoBeacon(s:Save,id:number,player:{x:number;z:number}){const l=s.world2.location,p=WORLD_TWO_BEACONS[id];if(!l||l.boss||!Number.isInteger(id)||!p||!canEnterWorldTwo(s.world2,s.level,l.region)||!Number.isFinite(player.x)||!Number.isFinite(player.z)||Math.hypot(player.x-p.x,player.z-p.z)>3)return {activated:false,completed:false};const r=s.world2.regions[l.region];if(r.beacons.includes(id))return {activated:false,completed:false};r.beacons.push(id);r.beacons.sort();const before=r.claimed;claimWorldTwoRegion(s,l.region);return {activated:true,completed:!before&&r.claimed};}
function dailySlot(region:number,boss:boolean) {
  return boss ? worldTwoBoss(region)!.dailySlot : region < WORLD_TWO_CORE_REGIONS ? region : region<6 ? region+1 : region+2;
}
export function worldTwoRewardFor(s:Save,region:number,boss=false,now=Date.now()) {
  if (!canEnterWorldTwo(s.world2,s.level,region,boss,operatorAccess()) || !Number.isFinite(new Date(now).getTime())) return {berries:0,xp:0,multiplier:0};
  const base = boss ? worldTwoBoss(region)! : WORLD_TWO_REGIONS[region];
  const count = s.world2.daily.date===todayKey(new Date(now)) ? s.world2.daily.counts[dailySlot(region,boss)] : 0;
  const multiplier = count>=(boss?3:100) ? .25 : 1;
  const potion = potionEffects(s,now), guardian = s.pet===PPOJJAK_PET_ID;
  return {berries:Math.floor(base.berries*multiplier*potion.berryMultiplier*(guardian?1.5:1)),xp:Math.floor(base.xp*multiplier*potion.xpMultiplier*(guardian?1.4:1)),multiplier};
}
export function grantWorldTwoReward(s:Save,event:HuntDefeatEvent,seconds:number,now=Date.now()) {
  const empty={berries:0,xp:0,levels:0,completed:false,boss:false,first:false,multiplier:0};
  const location=s.world2.location;
  if (!location || event.practice || event.encounter!=='world2-'+location.region+(location.boss?'-boss':'') || !Number.isFinite(seconds) || seconds<=0) return empty;
  const seen=claims.get(s)??new Set<string>();
  if (seen.has(event.id)) return empty;
  const reward=worldTwoRewardFor(s,location.region,location.boss,now);
  if (!reward.multiplier) return empty;
  seen.add(event.id); claims.set(s,seen);
  const date=todayKey(new Date(now)), slot=dailySlot(location.region,location.boss);
  if (s.world2.daily.date!==date) s.world2.daily=emptyWorldTwoDaily(date);
  s.world2.daily.counts[slot]=Math.min(1e9,s.world2.daily.counts[slot]+1);
  let levels=award(s,reward.berries,reward.xp),completed=false,first=false;
  const unlocked=canEnterWorldTwo(s.world2,s.level,location.region,location.boss);
  if(!unlocked)return {...reward,levels,completed:false,boss:location.boss,first:false};
  if (location.boss) {
    const encounter=worldTwoBoss(location.region)!;
    if (location.region===2) {
      first=!s.world2.bossClaimed;
      s.world2.bossWins=Math.min(1e9,s.world2.bossWins+1);
      s.world2.bossClaimed=true;
      s.world2.bestBossSeconds=Math.min(s.world2.bestBossSeconds??Infinity,seconds);
      if (first) for (let id=26;id<29;id++) {
        s.outfits[id]??=0;
        if (!s.discoveries.outfits.includes(id)) s.discoveries.outfits.push(id);
      }
    } else {
      const progress=s.world2.outerBoss;
      first=progress.wins===0;
      progress.wins=Math.min(1e9,progress.wins+1);
      progress.bestSeconds=Math.min(progress.bestSeconds??Infinity,seconds);
    }
    if (first) levels+=award(s,encounter.firstBerries,encounter.firstXp);
  } else {
    const region=s.world2.regions[location.region], wasClaimed=region.claimed;
    region.kills=Math.min(1e9,region.kills+1);
    claimWorldTwoRegion(s,location.region);
    completed=!wasClaimed&&region.claimed;
  }
  return {...reward,levels,completed,boss:location.boss,first};
}
