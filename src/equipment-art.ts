/** Original Berry Forest silhouettes shared by SVG catalogue art and equipped models. IDs are save IDs. */
export const WEAPON_ART = [['sword','leaf',1],['hammer','leaf',1],['fan'],['staff','flower'],['sword','berry'],['axe'],['water'],['staff','star'],['ladle'],['sword','cloud'],['spear','leaf'],['staff','candy'],['umbrella'],['flail'],['book','star'],['staff','sun'],['paw'],['sword','star'],['pencil'],['harp'],['bell'],['spear','sun'],['staff','berry'],['hammer','star',1],['twin'],['bow','sun',1],['sword','star'],['sword','leaf'],['staff','sun'],['bow','leaf',1],['sword','gem'],['staff','gem'],['bow','gem'],['sword','star'],['staff','star',1],['bow','moon',1],['sword','moon',1],['staff','gem',1],['bow','star',1],['hammer','leaf'],['scythe'],['book','snow',1],['sword','sun'],['harp'],['bow','star',1]] as const;
export const OUTFIT_ART = ['tunic','hanbok','cloak','robe','robe','wizard','samurai','hanbok','overall','duck','bunny','ranger','cat','sheep','frog','fairy','dress','bee','robe','suit','armor','dress','space','suit','armor','queen','armor','wizard','ranger','armor','queen','ranger','armor','bard','cloak'] as const;
export const OUTFIT_MOTIFS = ['leaf','flower','leaf','cloud','flower','star','moon','flower','berry','cloud','moon','leaf','paw','cloud','leaf','star','sun','sun','cloud','star','paw','flower','star','berry','moon','star','leaf','star','leaf','moon','gem','star','sun','note','leaf'] as const;
export function weaponMaterial(id:number):'wood'|'steel'|'crystal'|'starlight' {
  if(id===0||id===1||id===23||id===39)return 'wood';
  if([24,30,31,32,37,41].includes(id))return 'crystal';
  if(id>=26||[7,11,17,22].includes(id))return 'starlight';
  return 'steel';
}
