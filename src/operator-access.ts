/** Runtime-only privileges: save files and teacher mode never grant operator access. */
let verified:()=>boolean=()=>false;
export function bindOperatorAccess(check:()=>boolean){verified=check;}
export function operatorAccess(){return verified()===true;}
