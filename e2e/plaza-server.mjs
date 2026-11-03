import {Miniflare} from 'miniflare';
import {spawnSync} from 'node:child_process';
const built=spawnSync(process.execPath,['scripts/build-plaza.mjs'],{stdio:'inherit'});if(built.status!==0)process.exit(built.status??1);
const mf=new Miniflare({modules:true,scriptPath:'.plaza-worker/index.js',compatibilityDate:'2026-07-01',durableObjects:{PLAZA:{className:'SharedPlaza',useSQLite:true}},host:'127.0.0.1',port:5189});
console.log('Plaza test server: '+await mf.ready);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await mf.dispose();process.exit(0);});
