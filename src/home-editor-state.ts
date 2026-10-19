import { availableHome, craftHome, HOME_ITEMS, layoutError, placeHome, storeHome, type HomeObject } from './homestead';
import type { Save } from './rules';

type Snapshot = { berries:number; owned:number[]; objects:HomeObject[]; nextId:number };
export class HomeEditorSession {
  selection:HomeObject|null=null;
  private history:Snapshot[]=[];
  constructor(readonly save:Save,private full:()=>boolean){}
  get canUndo(){return this.history.length>0;}
  choose(kind:number){this.selection={uid:0,kind,column:5,row:7,rotation:0};}
  select(uid:number){const o=this.save.homestead.objects.find(o=>o.uid===uid);this.selection=o?{...o}:null;}
  cancel(){this.selection=null;}
  move(column:number,row:number){if(this.selection){this.selection.column=column;this.selection.row=row;}}
  rotate(){if(this.selection)this.selection.rotation=(this.selection.rotation+1)%4;}
  error(){const o=this.selection;if(!o)return '';if(!o.uid&&availableHome(this.save,o.kind)<=0)return '먼저 물건을 만들어 주세요.';return layoutError(this.save.homestead.objects.filter(x=>x.uid!==o.uid).concat({...o,uid:o.uid||this.save.homestead.nextId}));}
  private snapshot():Snapshot{return {berries:this.save.berries,owned:[...this.save.homestead.owned],objects:this.save.homestead.objects.map(o=>({...o})),nextId:this.save.homestead.nextId};}
  private remember(s:Snapshot){this.history.push(s);if(this.history.length>20)this.history.shift();}
  craft(kind:number){const old=this.snapshot(),error=craftHome(this.save,kind,this.full());if(!error){this.remember(old);this.choose(kind);}return error;}
  place(){const o=this.selection;if(!o)return '놓을 물건을 골라 주세요.';const old=this.snapshot(),error=placeHome(this.save,o.kind,o.column,o.row,o.rotation,this.full(),o.uid||undefined);if(!error){this.remember(old);this.cancel();}return error;}
  store(){const o=this.selection;if(!o?.uid)return false;const old=this.snapshot();if(!storeHome(this.save,o.uid))return false;this.remember(old);this.cancel();return true;}
  undo(){const old=this.history.pop();if(!old)return false;this.save.berries=old.berries;this.save.homestead.owned=old.owned;this.save.homestead.objects=old.objects;this.save.homestead.nextId=old.nextId;this.cancel();return true;}
}

export function homeCellAt(x:number,z:number){return {column:Math.floor((x+12)/2),row:Math.floor((z+12)/2)};}
