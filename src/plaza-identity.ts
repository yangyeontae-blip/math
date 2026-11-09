import type {Save} from './rules';
import {parsePlazaProfile,type PlazaProfile} from './plaza-protocol';
export function plazaProfile(s:Save):PlazaProfile|null {
 return parsePlazaProfile({
  selectedTitleId:s.selectedTitleId,nickname:s.nickname,level:s.level,character:s.character,outfit:s.outfit,weapon:s.weapon,
  outfitLevel:s.outfits[s.outfit]??0,weaponLevel:s.weapons[s.weapon]??0,hairstyle:s.hairstyle,face:s.face,pet:s.pet,ride:s.ride,
  job:s.career.job??'novice',rank:s.career.job?s.career.ranks[s.career.job]:0,achievement:s.expedition.selectedTitle,
  gradeTitle:s.curriculum.graduationClaimed?s.grade:0,multiplicationTitle:s.multiplicationCompleted,
 });
}
