/** One source for school, saved career gates and public character information. */
export const CAREER_LEVELS=[10,30,60,100,200] as const;
export const CAREER_MAX_RANK=5;
export const CAREER_TITLES={
 novice:['새싹 모험가','새싹 모험가','새싹 모험가','새싹 모험가','새싹 모험가','새싹 모험가'],
 knight:['새싹 모험가','기사','수호기사','고대숲 기사','여명의 성기사','태양서약 기사단장'],
 mage:['새싹 모험가','마법사','마도사','별빛 현자','은하 대마법사','별자리의 초월자'],
 ranger:['새싹 모험가','궁수','레인저','폭풍의 궁수','하늘의 명궁','천공의 추적자'],
 druid:['새싹 모험가','정령술사','숲의 영매','고대숲 현인','세계수의 목소리','생명의 대정령'],
 alchemist:['새싹 모험가','별길 연금술사','수정 연성사','오로라 현자','별의 창조자','우주의 연성자'],
 bard:['새싹 모험가','별노래 음유시인','숲의 연주자','달빛 지휘자','오로라 악장','별바다 교향악사'],
} as const;
export type CareerJob=Exclude<keyof typeof CAREER_TITLES,'novice'>;
