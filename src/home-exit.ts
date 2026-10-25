/** The lower end of the private garden path leads back to the central village. */
export const HOME_PLAZA_EXIT={x:0,z:26,triggerZ:24.8,halfWidth:1.4} as const;
export function homePlazaExitReached(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x-HOME_PLAZA_EXIT.x)<=HOME_PLAZA_EXIT.halfWidth&&z>=HOME_PLAZA_EXIT.triggerZ&&z<=28;}