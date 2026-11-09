export type GroundPoint={x:number;z:number};
/** Only accept traversable ground; search close to the player before the known-safe fallback. */
export function safeLanding(point:GroundPoint,fallback:GroundPoint,valid:(x:number,z:number)=>boolean):GroundPoint{
 if(valid(point.x,point.z))return {...point};
 for(let radius=.75;radius<=60;radius+=.75){const steps=Math.max(12,Math.ceil(radius*8));for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2,x=point.x+Math.cos(a)*radius,z=point.z+Math.sin(a)*radius;if(valid(x,z))return {x,z};}}
 if(valid(fallback.x,fallback.z))return {...fallback};throw Error('착지할 안전한 지점을 찾지 못했어요.');
}
