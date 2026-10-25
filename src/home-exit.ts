/** The visible lower gateway offers an explicit interaction; proximity never causes travel. */
export const HOME_PLAZA_EXIT={x:0,z:26,reach:2.8} as const;
export function homeExitInReach(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-HOME_PLAZA_EXIT.x,z-HOME_PLAZA_EXIT.z)<HOME_PLAZA_EXIT.reach;}
